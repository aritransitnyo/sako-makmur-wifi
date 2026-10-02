# DOKUMEN 02: SKEMA DATABASE & MANAJEMEN STATE
**Proyek:** Sako Makmur WiFi Management Web App (LSM NetOS)  
**Database:** Supabase PostgreSQL (`https://quxkfnlizpsdccuomqdd.supabase.co`)  

---

## 1. Skema Tabel Utama

### 1.1 `subscribers` (Pelanggan PPPoE)
Menyimpan data pelanggan, akun PPPoE, dan status pembayaran periode aktif.
- `id` (TEXT, PK): ID unik pelanggan (format: UUID atau string slug).
- `username_pppoe` (TEXT, NOT NULL, UNIQUE): Username akun PPPoE di MikroTik.
- `pppoe_password` (TEXT): Password PPPoE MikroTik.
- `full_name` (TEXT, NOT NULL): Nama lengkap pelanggan.
- `package_id` (TEXT): Referensi paket (`pkg-5m`, `pkg-8m`, dll).
- `package_name` (TEXT): Nama paket (misal: "Paket Up to 8 Mbps").
- `package_price` (NUMERIC): Tarif bulanan (CHECK: `>= 0`).
- `installation_fee` (NUMERIC): Biaya pasang baru (PSB).
- `address` (TEXT): Alamat pemasangan.
- `phone` (TEXT): Nomor telepon / WhatsApp.
- `status` (TEXT): Status layanan (`active`, `suspended`, `terminated`, `pending_installation`).
- `due_date` (INTEGER): Tanggal jatuh tempo (standar: 18).
- `payment_status` (TEXT): Status pembayaran bulan berjalan (`paid`, `unpaid`).
- `payment_method` (TEXT): Metode bayar (`Tunai`, `Transfer Bank`).
- `last_paid_at` (TIMESTAMP): Waktu pelunasan terakhir.

### 1.2 `expenses` (Buku Kas & Jurnal Pengeluaran/Pemasukan)
Menyimpan mutasi arus kas operasional (OPEX) dan pemasukan lainnya.
- `id` (TEXT, PK): ID transaksi.
- `date` (TEXT / DATE): Tanggal transaksi (format: `YYYY-MM-DD`).
- `type` (TEXT): Jenis mutasi (`income` | `expense`).
- `category` (TEXT): Kategori (misal: "Iuran Internet", "Operasional Starlink", "Gaji", "Beban Penagihan", "Marketing").
- `amount` (NUMERIC): Nominal transaksi (CHECK: `>= 0`).
- `description` (TEXT): Keterangan transaksi.
- `fund_source` (TEXT): Asal dana (`Kas Operasional`, `Kas Sisa Modal`, `Kas Dana Cadangan (Maintenance)`, `Dana Talangan Pengelola`).
- `receipt_url` (TEXT): Link bukti nota/kuitansi.
- `created_at` (TIMESTAMP): Waktu pencatatan.

### 1.3 `payment_history` (Log Riwayat Pembayaran Permanen)
Menyimpan arsip pembayaran yang tidak terhapus saat terjadi reset tutup buku bulanan.
- `id` (TEXT, PK): ID entri riwayat.
- `subscriber_id` (TEXT, NOT NULL): Relasi ke tabel `subscribers(id)`.
- `subscriber_name` (TEXT, NOT NULL): Nama pelanggan saat bayar.
- `username_pppoe` (TEXT): Username PPPoE.
- `period_key` (TEXT, NOT NULL): Periode pembayaran (format: `YYYY-MM`).
- `paid_at` (TIMESTAMP WITH TIME ZONE, NOT NULL): Waktu transaksi pelunasan.
- `amount` (NUMERIC, NOT NULL): Nominal pembayaran (CHECK: `>= 0`).
- `package_name` (TEXT): Nama paket saat transaksi.
- `package_price` (NUMERIC): Tarif paket.
- `payment_method` (TEXT): `Tunai` atau `Transfer Bank`.
- `receipt_number` (TEXT): Nomor kuitansi unik.
- *Constraint:* `UNIQUE (subscriber_id, period_key)`.

### 1.4 `monthly_closings` (Arsip Tutup Buku Bulanan)
Snapshot kondisi finansial pada saat tutup buku tanggal 25.
- `id` (TEXT, PK): ID tutup buku.
- `period_month` (TEXT): Nama bulan (misal: "September 2026").
- `period_key` (TEXT, UNIQUE): Format periode `YYYY-MM`.
- `closed_at` (TIMESTAMP): Waktu tutup buku dilakukan.
- `closed_by` (TEXT): Admin yang menutup buku.
- `active_subscribers_count` (INTEGER): Total user aktif.
- `paid_subscribers_count` (INTEGER): Total user lunas.
- `gross_revenue` (NUMERIC): Total pendapatan kotor diterima.
- `total_expenses` (NUMERIC): Total biaya operasional yang dikeluarkan.
- `reserve_fund_amount` (NUMERIC): Alokasi cadangan kas (10%).
- `reserve_fund_pct` (NUMERIC): Persentase cadangan (default: 10.0).
- `net_profit` (NUMERIC): Laba bersih yang dibagikan ke investor.
- `investor_dividends` (JSONB): Array snapshot pembagian dividen tiap investor.
- `notes` (TEXT): Catatan khusus periode tersebut.

### 1.5 `investors` (Daftar Pemegang Saham Konsorsium)
- `id` (TEXT, PK): ID investor.
- `name` (TEXT): Nama investor.
- `role` (TEXT): `Managing Owner` atau `Investor`.
- `capital_invested` (NUMERIC): Modal disetor (Rupiah).
- `share_percentage` (NUMERIC): Porsi kepemilikan saham (%).
- `join_date` (TEXT): Tanggal mulai kontrak (e.g. `2026-09-01`).
- `contract_months` (INTEGER): Durasi kontrak (12 bulan).
- `bank_name` (TEXT): Nama Bank tujuan transfer dividen.
- `account_number` (TEXT): Nomor Rekening.
- `account_holder` (TEXT): Nama pemilik rekening.

### 1.6 `pppoe_packages` & `capex_items`
- `pppoe_packages`: Katalog paket internet (5M, 8M, 10M, 15M, 20M).
- `capex_items`: Rincian belanja modal Rp 22.300.000 (Starlink kit, Router, Switch, OLT, Kabel FO, Tiang, Ongkos Pasang).

---

## 2. Integritas Data & Audit Lock Trigger (PostgreSQL)

Database telah dilengkapi fungsi trigger `check_expense_period_lock()`:
- Jika seseorang mencoba melakukan `UPDATE` atau `DELETE` pada tabel `expenses` untuk tanggal yang `period_key` (YYYY-MM)-nya sudah tercatat di tabel `monthly_closings`, PostgreSQL akan otomatis melempar error:
  `Audit Violation [IS-LOCK-001]: Transaksi kas tanggal ... (Periode ...) telah TUTUP BUKU dan berstatus LOCKED.`
- Hal ini melindungi riwayat kas agar laporan yang sudah dibagikan ke investor tidak dapat dimanipulasi di masa depan.

---

## 3. Sinkronisasi Data (`src/lib/dataStore.ts`)

- DataStore bertindak sebagai lapisan abstraksi antara UI dan Supabase.
- Menyediakan fungsi CRUD terpadu (`loadAllData`, `saveSubscriber`, `recordPayment`, `recordExpense`, `executeMonthlyClosing`).
- Jika koneksi Supabase gagal atau offline, dataStore memiliki fallback in-memory state agar UI tidak crash.
