export interface BusinessSettings {
  id?: string;
  business_name: string;
  starlink_cost: number;
  node_power_cost: number;
  operator_salary: number;
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
  created_at?: string;
}

export interface CapexItem {
  id: string;
  item_name: string;
  category?: 'Starlink & Backhaul' | 'MikroTik & Core' | 'Kabel & Distribusi' | 'Power & Backup' | 'Lainnya';
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
  fund_source?: 'Kas Operasional' | 'Kas Sisa Modal' | 'Dana Talangan Pengelola';
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
