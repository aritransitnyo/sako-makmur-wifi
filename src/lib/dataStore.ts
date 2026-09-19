import { supabase } from './supabaseClient';
import { BusinessSettings, Investor, CapexItem, PppoePackage, Subscriber } from '../types';

export const DEFAULT_SETTINGS: BusinessSettings = {
  business_name: 'Sako Makmur WiFi',
  starlink_cost: 850000,
  node_power_cost: 300000,
  operator_salary: 1000000,
  reserve_fund_pct: 10.0,
};

export const DEFAULT_INVESTORS: Investor[] = [
  {
    id: 'inv-1',
    name: 'Anton (Managing Owner)',
    role: 'Managing Owner',
    capital_invested: 15000000,
    share_percentage: 60.0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'inv-2',
    name: 'Budi Santoso',
    role: 'Investor',
    capital_invested: 5000000,
    share_percentage: 20.0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'inv-3',
    name: 'Haji Rahmat',
    role: 'Investor',
    capital_invested: 5000000,
    share_percentage: 20.0,
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_PACKAGES: PppoePackage[] = [
  {
    id: 'pkg-1',
    package_name: 'Paket Hemat 10 Mbps',
    speed_limit: '10 Mbps',
    price_monthly: 100000,
  },
  {
    id: 'pkg-2',
    package_name: 'Paket Keluarga 20 Mbps',
    speed_limit: '20 Mbps',
    price_monthly: 150000,
  },
  {
    id: 'pkg-3',
    package_name: 'Paket Usaha 30 Mbps',
    speed_limit: '30 Mbps',
    price_monthly: 200000,
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
];

export const DEFAULT_SUBSCRIBERS: Subscriber[] = [
  {
    id: 'sub-1',
    username_pppoe: 'sako_rt01_budi',
    full_name: 'Budi Kurniawan',
    package_id: 'pkg-2',
    package_name: 'Paket Keluarga 20 Mbps',
    package_price: 150000,
    address: 'RT 01 / RW 02 No. 12',
    phone: '081234567801',
    status: 'active',
  },
  {
    id: 'sub-2',
    username_pppoe: 'sako_rt01_warno',
    full_name: 'Warno Sucipto',
    package_id: 'pkg-1',
    package_name: 'Paket Hemat 10 Mbps',
    package_price: 100000,
    address: 'RT 01 / RW 02 No. 18',
    phone: '081234567802',
    status: 'active',
  },
  {
    id: 'sub-3',
    username_pppoe: 'sako_rt02_warung',
    full_name: 'Warung Bu Siti',
    package_id: 'pkg-3',
    package_name: 'Paket Usaha 30 Mbps',
    package_price: 200000,
    address: 'RT 02 / RW 02 Depan Lapangan',
    phone: '081234567803',
    status: 'active',
  },
  {
    id: 'sub-4',
    username_pppoe: 'sako_rt02_hendra',
    full_name: 'Hendra Wijaya',
    package_id: 'pkg-2',
    package_name: 'Paket Keluarga 20 Mbps',
    package_price: 150000,
    address: 'RT 02 / RW 02 No. 05',
    phone: '081234567804',
    status: 'active',
  },
  {
    id: 'sub-5',
    username_pppoe: 'sako_rt03_agus',
    full_name: 'Agus Purnomo',
    package_id: 'pkg-1',
    package_name: 'Paket Hemat 10 Mbps',
    package_price: 100000,
    address: 'RT 03 / RW 02 No. 09',
    phone: '081234567805',
    status: 'active',
  },
  {
    id: 'sub-6',
    username_pppoe: 'sako_rt03_dedi',
    full_name: 'Dedi Irawan',
    package_id: 'pkg-2',
    package_name: 'Paket Keluarga 20 Mbps',
    package_price: 150000,
    address: 'RT 03 / RW 02 No. 22',
    phone: '081234567806',
    status: 'suspended',
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
    } catch {
      // Supabase table missing or connection failed
    }
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
    return { data: this.getLocal('investors', DEFAULT_INVESTORS), isSupabase: false };
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
    return { data: this.getLocal('capex', DEFAULT_CAPEX), isSupabase: false };
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
    return { data: this.getLocal('packages', DEFAULT_PACKAGES), isSupabase: false };
  }

  // Subscribers
  static async getSubscribers(): Promise<{ data: Subscriber[]; isSupabase: boolean }> {
    try {
      const { data, error } = await supabase.from('subscribers').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return { data, isSupabase: true };
      }
    } catch {}
    return { data: this.getLocal('subscribers', DEFAULT_SUBSCRIBERS), isSupabase: false };
  }

  static async saveSubscribers(subscribers: Subscriber[]): Promise<void> {
    this.setLocal('subscribers', subscribers);
    try {
      for (const sub of subscribers) {
        await supabase.from('subscribers').upsert(sub);
      }
    } catch {}
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
    full_name TEXT NOT NULL,
    package_id UUID REFERENCES pppoe_packages(id) ON DELETE SET NULL,
    package_name TEXT,
    package_price NUMERIC(12,2),
    address TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Seed Data Awal
INSERT INTO business_settings (business_name, starlink_cost, node_power_cost, operator_salary, reserve_fund_pct)
VALUES ('Sako Makmur WiFi', 850000, 300000, 1000000, 10.00)
ON CONFLICT DO NOTHING;
`;
