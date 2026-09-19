export interface BusinessSettings {
  id?: string;
  business_name: string;
  starlink_cost: number;
  node_power_cost: number;
  operator_salary: number;
  reserve_fund_pct: number;
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
  full_name: string;
  package_id: string;
  package_name?: string;
  package_price?: number;
  address: string;
  phone: string;
  status: 'active' | 'suspended' | 'terminated';
  created_at?: string;
}

export interface ReserveFundTransaction {
  id: string;
  transaction_type: 'in' | 'out';
  amount: number;
  description: string;
  created_at?: string;
}

export type TabType = 'dashboard' | 'subscribers' | 'capex' | 'investors' | 'simulator';
