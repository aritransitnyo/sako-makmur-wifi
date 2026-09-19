import { supabase } from './supabaseClient';
import {
  BusinessSettings,
  Investor,
  CapexItem,
  PppoePackage,
  Subscriber,
  ExpenseTransaction,
  MonthlyClosing,
  InvestorDividendSnapshot,
} from '../types';

export const DEFAULT_SETTINGS: BusinessSettings = {
  business_name: 'Sako Makmur WiFi',
  starlink_cost: 850000,
  node_power_cost: 300000,
  operator_salary: 1000000,
  collector_fee_per_user: 5000,
  marketing_fee_monthly: 250000,
  reserve_fund_pct: 10.0,
  admin_pin: '1234',
};

export const DEFAULT_INVESTORS: Investor[] = [
  {
    id: 'inv-1',
    name: 'Ahmad Fauzi',
    role: 'Managing Owner',
    capital_invested: 15000000,
    share_percentage: 60.0,
    join_date: '2026-09-01',
    contract_months: 12,
    created_at: new Date().toISOString(),
  },
  {
    id: 'inv-2',
    name: 'Tri Wahyono',
    role: 'Investor',
    capital_invested: 5000000,
    share_percentage: 20.0,
    join_date: '2026-09-01',
    contract_months: 12,
    created_at: new Date().toISOString(),
  },
  {
    id: 'inv-3',
    name: 'Anwar Khadafi Saimona',
    role: 'Investor',
    capital_invested: 5000000,
    share_percentage: 20.0,
    join_date: '2026-09-01',
    contract_months: 12,
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_PACKAGES: PppoePackage[] = [
  {
    id: 'pkg-5m',
    package_name: 'Paket Up to 5 Mbps',
    speed_limit: '5 Mbps',
    price_monthly: 200000,
  },
  {
    id: 'pkg-8m',
    package_name: 'Paket Up to 8 Mbps',
    speed_limit: '8 Mbps',
    price_monthly: 250000,
  },
  {
    id: 'pkg-10m',
    package_name: 'Paket Up to 10 Mbps',
    speed_limit: '10 Mbps',
    price_monthly: 300000,
  },
  {
    id: 'pkg-15m',
    package_name: 'Paket Up to 15 Mbps',
    speed_limit: '15 Mbps',
    price_monthly: 400000,
  },
  {
    id: 'pkg-20m',
    package_name: 'UMKM & KANTOR (Up to 20 Mbps)',
    speed_limit: '20 Mbps',
    price_monthly: 500000,
  },
];

export const DEFAULT_CAPEX: CapexItem[] = [
  {
    id: 'cap-1',
    item_name: 'Starlink Gen 3 Standard Kit & Mount',
    category: 'Starlink & Backhaul',
    quantity: 1,
    unit: 'unit',
    unit_price: 7800000,
    total_price: 7800000,
  },
  {
    id: 'cap-2',
    item_name: 'MikroTik Cloud Router RB750Gr3 / RB4011',
    category: 'MikroTik & Core',
    quantity: 1,
    unit: 'unit',
    unit_price: 1350000,
    total_price: 1350000,
  },
  {
    id: 'cap-3',
    item_name: 'Kabel Dropcore FO 1 Core 3 Seling (1000m)',
    category: 'Kabel & Distribusi',
    quantity: 2,
    unit: 'roll',
    unit_price: 1100000,
    total_price: 2200000,
  },
  {
    id: 'cap-4',
    item_name: 'Media Converter HTB 3100 A/B + Fast Connector',
    category: 'Kabel & Distribusi',
    quantity: 10,
    unit: 'pasang',
    unit_price: 165000,
    total_price: 1650000,
  },
  {
    id: 'cap-5',
    item_name: 'UPS ICA 1200VA + Aki Eksternal Cadangan Node',
    category: 'Power & Backup',
    quantity: 1,
    unit: 'unit',
    unit_price: 2800000,
    total_price: 2800000,
  },
  {
    id: 'cap-6',
    item_name: 'Mini ODP 8 Core, Pigtail, Protection Box',
    category: 'Kabel & Distribusi',
    quantity: 4,
    unit: 'box',
    unit_price: 225000,
    total_price: 900000,
  },
  {
    id: 'cap-7',
    item_name: 'Tiang Besi Galvanis 6 Meter & Klem Tarik',
    category: 'Lainnya',
    quantity: 5,
    unit: 'batang',
    unit_price: 320000,
    total_price: 1600000,
  },
  {
    id: 'cap-8',
    item_name: 'Jasa Tarik Kabel Backbone & Instalasi Awal Jaringan',
    category: 'Jasa & Instalasi',
    quantity: 1,
    unit: 'lot',
    unit_price: 4000000,
    total_price: 4000000,
  },
];

export const DEFAULT_SUBSCRIBERS: Subscriber[] = [
  {
    id: 'sub-1',
    username_pppoe: 'sako_rt01_budi',
    pppoe_password: '123',
    full_name: 'Budi Kurniawan',
    package_id: 'pkg-8m',
    package_name: 'Paket Up to 8 Mbps',
    package_price: 250000,
    address: 'RT 01 / RW 02 No. 12',
    phone: '081234567801',
    status: 'active',
    due_date: 18,
    payment_status: 'paid',
    last_paid_at: new Date().toISOString(),
  },
  {
    id: 'sub-2',
    username_pppoe: 'sako_rt01_warno',
    pppoe_password: '123',
    full_name: 'Warno Sucipto',
    package_id: 'pkg-5m',
    package_name: 'Paket Up to 5 Mbps',
    package_price: 200000,
    address: 'RT 01 / RW 02 No. 18',
    phone: '081234567802',
    status: 'active',
    due_date: 18,
    payment_status: 'paid',
    last_paid_at: new Date().toISOString(),
  },
  {
    id: 'sub-3',
    username_pppoe: 'sako_rt02_warung',
    pppoe_password: '123',
    full_name: 'Warung Bu Siti',
    package_id: 'pkg-20m',
    package_name: 'UMKM & KANTOR (Up to 20 Mbps)',
    package_price: 500000,
    address: 'RT 02 / RW 02 Depan Lapangan',
    phone: '081234567803',
    status: 'active',
    due_date: 18,
    payment_status: 'paid',
    last_paid_at: new Date().toISOString(),
  },
  {
    id: 'sub-4',
    username_pppoe: 'sako_rt02_hendra',
    pppoe_password: '123',
    full_name: 'Hendra Wijaya',
    package_id: 'pkg-10m',
    package_name: 'Paket Up to 10 Mbps',
    package_price: 300000,
    address: 'RT 02 / RW 02 No. 05',
    phone: '081234567804',
    status: 'active',
    due_date: 18,
    payment_status: 'paid',
    last_paid_at: new Date().toISOString(),
  },
  {
    id: 'sub-5',
    username_pppoe: 'sako_rt03_agus',
    pppoe_password: '123',
    full_name: 'Agus Purnomo',
    package_id: 'pkg-5m',
    package_name: 'Paket Up to 5 Mbps',
    package_price: 200000,
    address: 'RT 03 / RW 02 No. 09',
    phone: '081234567805',
    status: 'active',
    due_date: 18,
    payment_status: 'paid',
    last_paid_at: new Date().toISOString(),
  },
  {
    id: 'sub-6',
    username_pppoe: 'sako_rt03_dedi',
    pppoe_password: '123',
    full_name: 'Dedi Irawan',
    package_id: 'pkg-8m',
    package_name: 'Paket Up to 8 Mbps',
    package_price: 250000,
    address: 'RT 03 / RW 02 No. 22',
    phone: '081234567806',
    status: 'active',
    due_date: 18,
    payment_status: 'paid',
    last_paid_at: new Date().toISOString(),
  },
  {
    id: 'sub-7',
    username_pppoe: 'gunawan-123',
    pppoe_password: '123',
    full_name: 'Gunawan Prasetyo',
    package_id: 'pkg-5m',
    package_name: 'Paket Up to 5 Mbps',
    package_price: 200000,
    address: 'RT 01 Sako Makmur',
    phone: '081234567807',
    status: 'active',
    due_date: 18,
    payment_status: 'paid',
    last_paid_at: new Date().toISOString(),
  },
  {
    id: 'sub-8',
    username_pppoe: 'sidiq-123',
    pppoe_password: '123',
    full_name: 'Sidiq Permana',
    package_id: 'pkg-8m',
    package_name: 'Paket Up to 8 Mbps',
    package_price: 250000,
    address: 'RT 02 Sako Makmur',
    phone: '081234567808',
    status: 'active',
    due_date: 18,
    payment_status: 'paid',
    last_paid_at: new Date().toISOString(),
  },
  {
    id: 'sub-9',
    username_pppoe: 'topik-123',
    pppoe_password: '123',
    full_name: 'Taufik Hidayat',
    package_id: 'pkg-10m',
    package_name: 'Paket Up to 10 Mbps',
    package_price: 300000,
    address: 'RT 03 Sako Makmur',
    phone: '081234567809',
    status: 'active',
    due_date: 18,
    payment_status: 'paid',
    last_paid_at: new Date().toISOString(),
  },
  {
    id: 'sub-10',
    username_pppoe: 'user-tes',
    pppoe_password: '123',
    full_name: 'Pak RT Bambang',
    package_id: 'pkg-5m',
    package_name: 'Paket Up to 5 Mbps',
    package_price: 200000,
    address: 'RT 01 Sako Makmur',
    phone: '081234567810',
    status: 'active',
    due_date: 18,
    payment_status: 'paid',
    last_paid_at: new Date().toISOString(),
  },
  {
    id: 'sub-11',
    username_pppoe: 'user-test12',
    pppoe_password: '123',
    full_name: 'Rian Kurnia',
    package_id: 'pkg-5m',
    package_name: 'Paket Up to 5 Mbps',
    package_price: 200000,
    address: 'RT 02 Sako Makmur',
    phone: '081234567811',
    status: 'active',
    due_date: 18,
    payment_status: 'paid',
    last_paid_at: new Date().toISOString(),
  },
];

export const DEFAULT_EXPENSES: ExpenseTransaction[] = [
  {
    id: 'exp-1',
    date: new Date().toISOString().split('T')[0],
    category: 'Langganan Starlink',
    amount: 850000,
    description: 'Tagihan bulanan Starlink Standard Kit',
  },
  {
    id: 'exp-2',
    date: new Date().toISOString().split('T')[0],
    category: 'Listrik & Token PLN',
    amount: 250000,
    description: 'Token listrik PLN Node RT 01 & UPS',
  },
  {
    id: 'exp-3',
    date: new Date().toISOString().split('T')[0],
    category: 'Gaji Operator',
    amount: 1000000,
    description: 'Uang operasional & maintenance jaringan',
  },
  {
    id: 'exp-4',
    date: new Date().toISOString().split('T')[0],
    category: 'Bensin & Transport',
    amount: 75000,
    description: 'Patroli jalur kabel FO & cek tiang',
  },
];

export const DEFAULT_CLOSINGS: MonthlyClosing[] = [
  {
    id: 'close-2026-08',
    period_month: 'Agustus 2026',
    period_key: '2026-08',
    closed_at: '2026-08-31T23:59:00.000Z',
    closed_by: 'Ahmad Fauzi (Managing Owner)',
    active_subscribers_count: 26,
    paid_subscribers_count: 26,
    gross_revenue: 5200000,
    total_expenses: 2225000,
    reserve_fund_amount: 520000,
    reserve_fund_pct: 10.0,
    net_profit: 2455000,
    investor_dividends: [
      {
        investor_id: 'inv-1',
        name: 'Ahmad Fauzi',
        role: 'Managing Owner',
        share_percentage: 60.0,
        dividend_amount: 1473000,
        paid_status: 'paid',
        paid_at: '2026-09-01T10:00:00.000Z',
      },
      {
        investor_id: 'inv-2',
        name: 'Tri Wahyono',
        role: 'Investor',
        share_percentage: 20.0,
        dividend_amount: 491000,
        paid_status: 'paid',
        paid_at: '2026-09-01T10:15:00.000Z',
      },
      {
        investor_id: 'inv-3',
        name: 'Anwar Khadafi Saimona',
        role: 'Investor',
        share_percentage: 20.0,
        dividend_amount: 491000,
        paid_status: 'paid',
        paid_at: '2026-09-01T10:20:00.000Z',
      },
    ],
    notes: 'Tutup buku bulan Agustus 2026. Semua dividen telah ditransfer lunas via Bank ke rekening masing-masing investor.',
  },
];

// Helper to check LocalStorage safely
export class DataService {
  private static isClient = typeof window !== 'undefined';

  static getLocal<T>(key: string, defaultValue: T): T {
    if (!this.isClient) return defaultValue;
    try {
      const stored = localStorage.getItem(`smw_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static setLocal<T>(key: string, value: T): void {
    if (!this.isClient) return;
    try {
      localStorage.setItem(`smw_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }

  // Load Settings
  static async getSettings(): Promise<{ data: BusinessSettings; isSupabase: boolean }> {
    try {
      const { data, error } = await supabase.from('business_settings').select('*').limit(1).maybeSingle();
      if (!error && data) {
        return { data, isSupabase: true };
      }
    } catch {}
    return { data: this.getLocal('settings', DEFAULT_SETTINGS), isSupabase: false };
  }

  static async updateSettings(settings: BusinessSettings): Promise<void> {
    this.setLocal('settings', settings);
    try {
      await supabase.from('business_settings').upsert({
        ...settings,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Supabase updateSettings fallback:', e);
    }
  }

  // Investors
  static async getInvestors(): Promise<{ data: Investor[]; isSupabase: boolean }> {
    try {
      const { data, error } = await supabase.from('investors').select('*').order('capital_invested', { ascending: false });
      if (!error && data && data.length > 0) {
        return { data, isSupabase: true };
      }
    } catch {}
    const stored = this.getLocal('investors', DEFAULT_INVESTORS);
    const updated = stored.map((inv) => ({
      ...inv,
      join_date: inv.join_date || '2026-09-01',
      contract_months: inv.contract_months || 12,
    }));
    return { data: updated, isSupabase: false };
  }

  static async saveInvestors(investors: Investor[]): Promise<void> {
    this.setLocal('investors', investors);
    try {
      for (const inv of investors) {
        await supabase.from('investors').upsert(inv);
      }
    } catch {}
  }

  // CAPEX
  static async getCapex(): Promise<{ data: CapexItem[]; isSupabase: boolean }> {
    try {
      const { data, error } = await supabase.from('capex_items').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return { data, isSupabase: true };
      }
    } catch {}
    const stored = this.getLocal('capex', DEFAULT_CAPEX);
    // Auto-migration: ensure 'Jasa Tarik Kabel Backbone & Instalasi Awal Jaringan' (cap-8) is in stored
    const hasJasaPasang = stored.some(
      (c) => c.id === 'cap-8' || c.item_name?.toLowerCase().includes('instalasi') || c.item_name?.toLowerCase().includes('tarik kabel')
    );
    if (!hasJasaPasang) {
      const jasaItem = DEFAULT_CAPEX.find((c) => c.id === 'cap-8');
      if (jasaItem) {
        const merged = [...stored, jasaItem];
        this.setLocal('capex', merged);
        return { data: merged, isSupabase: false };
      }
    }
    return { data: stored, isSupabase: false };
  }

  static async saveCapex(items: CapexItem[]): Promise<void> {
    this.setLocal('capex', items);
    try {
      for (const item of items) {
        await supabase.from('capex_items').upsert(item);
      }
    } catch {}
  }

  // Packages
  static async getPackages(): Promise<{ data: PppoePackage[]; isSupabase: boolean }> {
    try {
      const { data, error } = await supabase.from('pppoe_packages').select('*').order('price_monthly', { ascending: true });
      if (!error && data && data.length > 0) {
        return { data, isSupabase: true };
      }
    } catch {}
    const stored = this.getLocal('packages', DEFAULT_PACKAGES);
    const hasOldPrices = stored.some((p) => p.price_monthly < 200000 || p.id === 'pkg-1');
    if (hasOldPrices) {
      this.setLocal('packages', DEFAULT_PACKAGES);
      return { data: DEFAULT_PACKAGES, isSupabase: false };
    }
    return { data: stored, isSupabase: false };
  }

  static async savePackages(packages: PppoePackage[]): Promise<void> {
    this.setLocal('packages', packages);
    try {
      for (const pkg of packages) {
        await supabase.from('pppoe_packages').upsert(pkg);
      }
    } catch {}
  }

  // Subscribers
  static async getSubscribers(): Promise<{ data: Subscriber[]; isSupabase: boolean }> {
    try {
      const { data, error } = await supabase.from('subscribers').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return { data, isSupabase: true };
      }
    } catch {}
    const stored = this.getLocal('subscribers', DEFAULT_SUBSCRIBERS);
    // Auto-migrate old 100rb prices to new official package prices
    const migrated = stored.map((s) => {
      if (!s.package_price || s.package_price < 200000) {
        if (s.package_name?.includes('20') || s.package_name?.includes('UMKM') || s.package_name?.includes('KANTOR')) {
          return { ...s, package_id: 'pkg-20m', package_name: 'UMKM & KANTOR (Up to 20 Mbps)', package_price: 500000 };
        } else if (s.package_name?.includes('15')) {
          return { ...s, package_id: 'pkg-15m', package_name: 'Paket Up to 15 Mbps', package_price: 400000 };
        } else if (s.package_name?.includes('10')) {
          return { ...s, package_id: 'pkg-10m', package_name: 'Paket Up to 10 Mbps', package_price: 300000 };
        } else if (s.package_name?.includes('8')) {
          return { ...s, package_id: 'pkg-8m', package_name: 'Paket Up to 8 Mbps', package_price: 250000 };
        } else {
          return { ...s, package_id: 'pkg-5m', package_name: 'Paket Up to 5 Mbps', package_price: 200000 };
        }
      }
      return s;
    });
    this.setLocal('subscribers', migrated);
    return { data: migrated, isSupabase: false };
  }

  static async saveSubscribers(subscribers: Subscriber[]): Promise<void> {
    this.setLocal('subscribers', subscribers);
    try {
      for (const sub of subscribers) {
        await supabase.from('subscribers').upsert(sub);
      }
    } catch {}
  }

  // Expenses (Buku Kas Riil)
  static async getExpenses(): Promise<{ data: ExpenseTransaction[]; isSupabase: boolean }> {
    return { data: this.getLocal('expenses', DEFAULT_EXPENSES), isSupabase: false };
  }

  static async saveExpenses(expenses: ExpenseTransaction[]): Promise<void> {
    this.setLocal('expenses', expenses);
  }

  // Monthly Closings (Riwayat Tutup Buku & Dividen)
  static async getMonthlyClosings(): Promise<{ data: MonthlyClosing[]; isSupabase: boolean }> {
    try {
      const { data, error } = await supabase.from('monthly_closings').select('*').order('closed_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return { data, isSupabase: true };
      }
    } catch {}
    return { data: this.getLocal('closings', DEFAULT_CLOSINGS), isSupabase: false };
  }

  static async saveMonthlyClosings(closings: MonthlyClosing[]): Promise<void> {
    this.setLocal('closings', closings);
    try {
      for (const item of closings) {
        await supabase.from('monthly_closings').upsert(item);
      }
    } catch {}
  }

  // Reset to Zero (Mulai dari Nol untuk Bisnis Baru)
  static resetToZero(businessName: string): void {
    if (!this.isClient) return;
    const cleanSettings: BusinessSettings = {
      business_name: businessName || 'Nama WiFi Anda',
      starlink_cost: 850000,
      node_power_cost: 300000,
      operator_salary: 1000000,
      reserve_fund_pct: 10.0,
    };
    this.setLocal('settings', cleanSettings);
    this.setLocal('investors', [
      {
        id: 'inv-owner',
        name: 'Pengelola / Founder',
        role: 'Managing Owner',
        capital_invested: 10000000,
        share_percentage: 100.0,
      },
    ]);
    this.setLocal('subscribers', []);
    this.setLocal('capex', []);
    this.setLocal('expenses', []);
    this.setLocal('closings', []);
  }

  // Reset back to sample demo data
  static resetToDemo(): void {
    if (!this.isClient) return;
    this.setLocal('settings', DEFAULT_SETTINGS);
    this.setLocal('investors', DEFAULT_INVESTORS);
    this.setLocal('packages', DEFAULT_PACKAGES);
    this.setLocal('capex', DEFAULT_CAPEX);
    this.setLocal('subscribers', DEFAULT_SUBSCRIBERS);
    this.setLocal('expenses', DEFAULT_EXPENSES);
    this.setLocal('closings', DEFAULT_CLOSINGS);
  }
}

export const SUPABASE_SQL_SCRIPT = `-- SQL Skema Lengkap untuk Sako Makmur WiFi
-- Buka Supabase Dashboard > SQL Editor > Paste & Run

CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL DEFAULT 'Sako Makmur WiFi',
    starlink_cost NUMERIC(12,2) DEFAULT 850000,
    node_power_cost NUMERIC(12,2) DEFAULT 300000,
    operator_salary NUMERIC(12,2) DEFAULT 1000000,
    reserve_fund_pct NUMERIC(5,2) DEFAULT 10.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS investors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Investor',
    capital_invested NUMERIC(12,2) NOT NULL DEFAULT 0,
    share_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS capex_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name TEXT NOT NULL,
    category TEXT DEFAULT 'Alat Jaringan',
    quantity INT NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'unit',
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_price NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS pppoe_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_name TEXT NOT NULL,
    speed_limit TEXT,
    price_monthly NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username_pppoe TEXT UNIQUE NOT NULL,
    pppoe_password TEXT DEFAULT '123',
    full_name TEXT NOT NULL,
    package_id UUID REFERENCES pppoe_packages(id) ON DELETE SET NULL,
    package_name TEXT,
    package_price NUMERIC(12,2),
    address TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active',
    due_date INT DEFAULT 10,
    payment_status TEXT DEFAULT 'unpaid',
    last_paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS monthly_closings (
    id TEXT PRIMARY KEY,
    period_month TEXT NOT NULL,
    period_key TEXT NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    closed_by TEXT NOT NULL,
    active_subscribers_count INT DEFAULT 0,
    paid_subscribers_count INT DEFAULT 0,
    gross_revenue NUMERIC(12,2) DEFAULT 0,
    total_expenses NUMERIC(12,2) DEFAULT 0,
    reserve_fund_amount NUMERIC(12,2) DEFAULT 0,
    reserve_fund_pct NUMERIC(5,2) DEFAULT 10.00,
    net_profit NUMERIC(12,2) DEFAULT 0,
    investor_dividends JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
`;
