# DOKUMEN 03: ATURAN BISNIS, FINANSIAL, & OPERASIONAL
**Proyek:** Sako Makmur WiFi Management Web App (LSM NetOS)  

---

## 1. Struktur Konsorsium Modal (Total Investasi: Rp 25.000.000)

Usaha Sako Makmur WiFi dibiayai bersama melalui konsorsium 3 pihak dengan perjanjian kontrak minimal 1 tahun (1 September 2026 s/d 31 Agustus 2027):

1. **Ahmad Fauzi**
   - Peran: Pemodal Utama / Investor
   - Modal Disetor: **Rp 15.000.000**
   - Porsi Saham: **60.0%**
2. **Tri Wahyono (Mas Tri)**
   - Peran: Managing Owner / Pengelola Teknis & Sistem
   - Modal Disetor: **Rp 5.000.000**
   - Porsi Saham: **20.0%**
3. **Anwar Khadafi Saimona**
   - Peran: Investor Konsorsium
   - Modal Disetor: **Rp 5.000.000**
   - Porsi Saham: **20.0%**

---

## 2. Siklus Bulanan Bisnis (Operational Lifecycle)

Semua otomatisasi dan alur kerja aplikasi mengikuti 3 tanggal krusial setiap bulan:

| Tanggal | Tahapan | Deskripsi Operasional |
|---|---|---|
| **10** | **Terbit Tagihan (*Bill Issue*)** | Tagihan bulanan resmi diterbitkan. WhatsApp reminder disiapkan untuk pelanggan. |
| **18** | **Jatuh Tempo (*Due Date*)** | Batas akhir pembayaran tanpa denda. Pelanggan yang menunggak dapat diisolir. |
| **25** | **Tutup Buku & Dividen (*Closing*)** | Perhitungan laba bersih final, pencadangan kas, dan transfer dividen investor. |

---

## 3. Paket Layanan & Tarif Resmi

Paket internet PPPoE bulanan yang berlaku:
- **Paket Up to 5 Mbps:** Rp 200.000 / bulan
- **Paket Up to 8 Mbps:** Rp 250.000 / bulan
- **Paket Up to 10 Mbps:** Rp 300.000 / bulan
- **Paket Up to 15 Mbps:** Rp 400.000 / bulan
- **Paket Up to 20 Mbps (UMKM & Kantor):** Rp 500.000 / bulan

---

## 4. Formula Akuntansi & Distribusi Dividen

Logika perhitungan akuntansi ditangani oleh `src/lib/financialCalculations.ts`:

1. **Pendapatan Kotor (*Gross Revenue*):**
   $$\text{Gross Revenue} = \sum (\text{Tarif Paket Pelanggan Lunas}) + \text{Biaya Pasang Baru (PSB)}$$
   *Catatan: Pelanggan yang belum membayar (`unpaid`) tidak dimasukkan ke kas aktual.*

2. **Cadangan Kas Wajib (*Reserve Fund*):**
   $$\text{Cadangan Kas} = 10\% \times \text{Gross Revenue}$$
   *Dipisahkan ke pos dana darurat/pemeliharaan sebelum dividen dibagikan.*

3. **Beban Operasional Rutin (*OPEX*):**
   - Langganan Starlink Standard: Rp 850.000
   - Listrik & Sumber Daya Node: Rp 300.000
   - Gaji Operator / Teknisi: Rp 500.000 – Rp 1.000.000
   - Beban Jasa Tagih Lapangan: **Rp 5.000 per pelanggan lunas**
   - Beban Komisi Marketing: **Rp 250.000 / bulan**

4. **Laba Bersih (*Net Profit*):**
   $$\text{Laba Bersih} = \text{Gross Revenue} - \text{Total OPEX} - \text{Cadangan Kas}$$

5. **Dividen Investor:**
   $$\text{Dividen} = \text{Laba Bersih} \times \text{Persentase Saham}$$
   - Ahmad Fauzi: $\text{Laba Bersih} \times 60\%$
   - Tri Wahyono: $\text{Laba Bersih} \times 20\%$
   - Anwar Khadafi: $\text{Laba Bersih} \times 20\%$

---

## 5. Kebijakan Manajemen Jaringan & Isolir

1. **Kebijakan Isolir Manual:**
   - **Auto-isolir otomatis dimatikan secara permanen**.
   - Pelanggan yang telat bayar **TIDAK diisolir secara otomatis oleh bot**.
   - Eksekusi isolir dilakukan manual oleh Mas Tri / Pengelola melalui tombol di Web App atau via Winbox setelah ada konfirmasi penagih lapangan.
2. **Karakteristik Interface MikroTik:**
   - IP WAN adalah CGNAT (`100.72.x.x` pada `ether1-WAN`).
   - Akses API luar masuk melalui SSTP client `vpn-tunnel-api` ke port 8728.
