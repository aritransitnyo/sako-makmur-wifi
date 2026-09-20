export interface BusinessSettings {
  id?: string;
  business_name: string;
  starlink_cost: number;
  node_power_cost: number;
  operator_salary: number;
  collector_fee_per_user?: number; // Jasa Tagih per Pelanggan (e.g. 5.000)
  marketing_fee_monthly?: number; // Jasa / Komisi Marketing Rutin
  reserve_fund_pct: number;
  admin_pin?: string;
  updated_at?: string;
}

export interface Investor {
  id: string;
  name: string;
  role: 'Managing Owner' | 'Investor';
  capital_invested: number;
  share_percentage: number;
  join_date?: string; // Tanggal mulai kontrak (e.g. '2026-09-01')
  contract_months?: number; // Durasi kontrak (default: 12 bulan)
  bank_name?: string; // Nama Bank / E-Wallet (e.g. BCA, BRI, Mandiri, BNI, BSI, Bank Sumsel Babel)
  account_number?: string; // Nomor Rekening
  account_holder?: string; // Nama Pemilik Rekening / Atas Nama
  created_at?: string;
}

export interface CapexItem {
  id: string;
  item_name: string;
  category?: 'Starlink & Backhaul' | 'MikroTik & Core' | 'Kabel & Distribusi' | 'Power & Backup' | 'Jasa & Instalasi' | 'Lainnya';
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  receipt_url?: string;
  created_at?: string;
}

export interface PppoePackage {
  id: string;
  package_name: string;
  speed_limit: string;
  price_monthly: number;
  created_at?: string;
}

export interface Subscriber {
  id: string;
  username_pppoe: string;
  pppoe_password?: string;
  full_name: string;
  package_id: string;
  package_name?: string;
  package_price?: number;
  installation_fee?: number; // Biaya Pasang Baru (PSB)
  address: string;
  phone: string;
  status: 'active' | 'suspended' | 'terminated';
  due_date: number; // 1 - 31
  payment_status: 'paid' | 'unpaid';
  payment_method?: 'Tunai' | 'Transfer Bank';
  last_paid_at?: string;
  created_at?: string;
}

export interface ExpenseTransaction {
  id: string;
  date: string;
  type?: 'expense' | 'income';
  category: string;
  amount: number;
  description: string;
  fund_source?: 'Kas Operasional' | 'Kas Sisa Modal' | 'Kas Dana Cadangan (Maintenance)' | 'Dana Talangan Pengelola';
  receipt_url?: string;
  created_at?: string;
}

export interface ReserveFundTransaction {
  id: string;
  transaction_type: 'in' | 'out';
  amount: number;
  description: string;
  created_at?: string;
}

export interface InvestorDividendSnapshot {
  investor_id: string;
  name: string;
  role: string;
  share_percentage: number;
  dividend_amount: number;
  paid_status: 'paid' | 'pending';
  paid_at?: string;
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
}

export interface MonthlyClosing {
  id: string;
  period_month: string;
  period_key: string;
  closed_at: string;
  closed_by: string;
  active_subscribers_count: number;
  paid_subscribers_count: number;
  gross_revenue: number;
  total_expenses: number;
  reserve_fund_amount: number;
  reserve_fund_pct: number;
  net_profit: number;
  investor_dividends: InvestorDividendSnapshot[];
  notes?: string;
}

export type TabType = 'dashboard' | 'subscribers' | 'expenses' | 'capex' | 'investors' | 'simulator';
