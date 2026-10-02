# DOKUMEN 01: ARSITEKTUR SISTEM & INTEGRASI JARINGAN
**Proyek:** Sako Makmur WiFi Management Web App (LSM NetOS)  
**Target Pembaca:** AI Developer / Software Engineer  

---

## 1. Ringkasan Proyek
Sistem ini adalah web dashboard operasional dan akuntansi untuk ISP Komunitas (PPPoE berbasis Starlink + distribusi hybrid FO). Web app ini mengelola pelanggan, pemantauan router MikroTik secara real-time, pencatatan kas harian, dan pembagian dividen konsorsium bulanan.

- **Repositori Git:** `https://github.com/aritransitnyo/sako-makmur-wifi.git`
- **Branch Aktif:** `main`
- **Tech Stack:**
  - Framework: Next.js 14 (Pages Router)
  - UI: React 18, Tailwind CSS, Lucide React
  - Language: TypeScript
  - Database Client: `@supabase/supabase-js`
  - Hosting: Vercel (`https://sako-makmur-wifi.vercel.app`)
- **PIN Pengaman Admin:** `140320` (di-handle oleh `src/components/AuthGate.tsx`)

---

## 2. Struktur Direktori Proyek

```text
sako-makmur-wifi/
├── src/
│   ├── components/               # Komponen Modular UI & Modal
│   │   ├── AuthGate.tsx          # Proteksi akses dengan PIN
│   │   ├── DashboardView.tsx     # Ringkasan analitik operasional & finansial
│   │   ├── SubscribersView.tsx   # Manajemen pelanggan PPPoE & tagihan
│   │   ├── ExpensesView.tsx      # Buku kas operasional & filter periode
│   │   ├── CapexView.tsx         # Pencatatan aset modal awal
│   │   ├── InvestorsView.tsx     # Saham investor & dividen
│   │   ├── MikrotikModal.tsx     # Status real-time traffic & session
│   │   ├── MonthlyClosingModal.tsx # Form tutup buku tanggal 25
│   │   └── ReceiptModal.tsx      # Cetak struk/nota pembayaran
│   ├── lib/
│   │   ├── supabaseClient.ts     # Inisialisasi client Supabase
│   │   ├── dataStore.ts          # Sinkronisasi state lokal & Supabase
│   │   ├── financialCalculations.ts # Logika akuntansi, OPEX, & laba bersih
│   │   └── mikrotikApi.ts        # Client biner protokol MikroTik TCP
│   ├── pages/
│   │   ├── _app.tsx              # Wrapper layout & theme
│   │   ├── index.tsx             # Main tab controller
│   │   └── api/
│   │       ├── mikrotik.ts       # Proxy serverless ke router / VPS bridge
│   │       ├── report-data.ts    # Endpoint data ringkas untuk script laporan
│   │       └── sync.ts           # Helper sinkronisasi
│   └── types/
│       └── index.ts              # Definisi interface TypeScript
├── docs/                         # Dokumentasi handover & panduan sistem
├── package.json
└── tailwind.config.js
```

---

## 3. Topologi & Alur Komunikasi Jaringan

```
[ Frontend Browser / Vercel ]
              │
              ├── (HTTPS REST) ──────────────────────────► [ Supabase PostgreSQL ]
              │                                             (Data Pelanggan & Keuangan)
              ▼
[ Next.js API Route: /api/mikrotik ]
              │
              │ (HTTP JSON Request via Port 10887)
              ▼
[ VPS MikroTik Bridge (43.173.1.92:10887) ]
              │
              │ (RouterOS API Binary Protocol Port 8728)
              ▼
[ SSTP VPN Tunnel: idn32.tunnel.id:3201 ]
              │
              ▼
[ Router Lapangan: MikroTik hEX RB750Gr3 ]
       ├── RouterOS v7.24.2 (stable)
       ├── PPPoE Pool: 10.10.10.0/24 (Gateway: 10.10.10.1)
       └── Hubungan ke OLT HiOSO (FTTH / FO)
```

### Detail Koneksi & Tunnel:
1. **MikroTik Remote Winbox:** `idn23.tunnel.id:3109` (Interface: `vpn-tunnel-id`, Client IP: `10.1.23.109`)
2. **HiOSO OLT Web GUI:** `idn24.tunnel.id:3039` (Interface: `vpn-tunnel-olt`, IP: `10.1.24.39`)
3. **MikroTik RouterOS API:** `idn32.tunnel.id:3201` -> port 8728 (Interface: `vpn-tunnel-api`, IP: `10.1.32.201`)
4. **VPS Bridge Daemon:** 
   - IP: `43.173.1.92`
   - Port: `10887`
   - Service systemd: `/etc/systemd/system/mikrotik-bridge.service`
   - Direktori kerja: `/opt/mikrotik-bridge/`

---

## 4. Variabel Environment (`.env.local`)

Untuk menjalankan sistem di lokal maupun konfigurasi Vercel:

```env
# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://quxkfnlizpsdccuomqdd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_brDhSrPoMdLdL8jzbGBM9A_tkuQxB58

# MIKROTIK HTTP BRIDGE (Mode Vercel Production)
MIKROTIK_BRIDGE_URL=http://43.173.1.92:10887
MIKROTIK_BRIDGE_KEY=3oR6TBDJQqTt2iykOysTHBWsAQh69TlbCXT07vndbCE

# MIKROTIK DIRECT TCP (Mode Development / Fallback)
MIKROTIK_API_HOST=idn32.tunnel.id
MIKROTIK_API_PORT=3201
MIKROTIK_API_USER=admin
MIKROTIK_API_PASS=SakoMakmur2026!
MIKROTIK_API_TIMEOUT=8000
```
