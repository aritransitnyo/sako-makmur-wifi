# DOKUMEN 04: PANDUAN PENGEMBANGAN & DAFTAR PERBAIKAN
**Proyek:** Sako Makmur WiFi Management Web App (LSM NetOS)  

---

## 1. Setup Lingkungan Pengembangan Lokal

Pastikan Node.js (v18+ atau v20+) telah terpasang.

```bash
# 1. Masuk ke direktori proyek
cd sako-makmur-wifi

# 2. Instalasi dependensi
npm install

# 3. Jalankan server pengembangan lokal (Next.js)
npm run dev
# Buka http://localhost:3000 pada browser

# 4. Uji build produksi sebelum commit/deploy
npm run build
```

---

## 2. Area Prioritas Perbaikan (Task List & Technical Debt)

Berikut adalah catatan pekerjaan teknis yang perlu diperhatikan dan disempurnakan:

### A. Buku Kas & Filter Periode (`ExpensesView.tsx`)
- **Masalah:** Header metrik ringkasan kas (Total Pengeluaran & Jumlah Transaksi) sebelumnya sempat menampilkan total kumulatif sepanjang masa (*all-time cumulative*), bukan per periode tab yang dipilih.
- **Tugas:** Pastikan perhitungan metrik di header selalu dinamis dan reaktif menyaring hanya transaksi yang sesuai dengan tab periode aktif vs arsip bulan lalu.

### B. Riwayat Pembayaran Permanen (`payment_history`)
- **Masalah:** Sistem lama hanya menyimpan status pelunasan terakhir pada record pelanggan di tabel `subscribers` (`payment_status`, `payment_method`, `last_paid_at`). Ketika tutup buku bulanan dilakukan, status ini di-reset sehingga jejak pembayaran bulan-bulan lalu tidak tercatat rapi per pelanggan.
- **Tugas:** Pastikan setiap transaksi pelunasan mencatat satu record permanen ke tabel `payment_history` (dengan `period_key = 'YYYY-MM'`). Sediakan fitur cetak ulang kuitansi (*reprint receipt*) dari riwayat pembayaran masa lalu.

### C. Kehandalan API Bridge MikroTik (`/api/mikrotik.ts` & `MikrotikModal.tsx`)
- **Masalah:** Jika router atau tunnel SSTP terputus sesaat, request API serverless dapat mengalami timeout (8 detik).
- **Tugas:** 
  - Pastikan UI menampilkan status *offline / connecting* yang jelas dengan pesan yang bersahabat (*graceful error handling*).
  - Hindari blocking render pada halaman dashboard jika status router sedang gagal dihubungi.

### D. Optimasi Tampilan Mobile / PWA
- Aplikasi sering diakses langsung lewat smartphone oleh Mas Tri maupun penagih lapangan.
- Pastikan modal (terutama `ReceiptModal`, `SubscribersView`, dan input pengeluaran) memiliki padding dan ukuran tombol yang nyaman di layar sentuh kecil.

---

## 3. Checklist Sebelum Push ke Production

Sebelum melakukan commit dan deploy ke Vercel:
- [ ] Jalankan `npm run build` dan pastikan tidak ada error TypeScript maupun kegagalan kompilasi Next.js.
- [ ] Pastikan tidak ada hardcoded credential sensitif yang tertulis langsung di file komponen publik.
- [ ] Verifikasi bahwa perubahan database tidak merusak constraint PostgreSQL yang sudah ada.
- [ ] Pastikan fungsi kalkulasi di `financialCalculations.ts` tetap akurat dan konsisten dengan formula konsorsium.
