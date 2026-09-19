import { BusinessSettings, Investor, Subscriber, CapexItem, ExpenseTransaction, MonthlyClosing } from '../types';

export interface FinancialSummary {
  activeSubs: Subscriber[];
  paidSubs: Subscriber[];
  unpaidSubs: Subscriber[];
  activeCount: number;
  paidCount: number;
  unpaidCount: number;

  // Revenue
  totalOmzet: number; // Real collected cash in (paid subscribers)
  totalPotensiOmzet: number; // Max potential revenue from all active subscribers
  uncollectedOmzet: number; // Outstanding unpaid dues

  // OPEX components
  starlinkCost: number;
  nodePowerCost: number;
  operatorSalary: number;
  collectorFeePerUser: number;
  totalCollectorFee: number;
  marketingFee: number;
  reserveFundPct: number;
  reserveFundAmount: number; // Alokasi bulan berjalan (10%)
  cumulativeReserveFund: number; // Total saldo tabungan cadangan terkini (akumulasi)
  reserveFundSpent: number; // Total belanja darurat/maintenance yang ditarik dari cadangan
  totalReserveAllocated: number; // Total akumulasi alokasi 10% (historis + berjalan)
  totalOpex: number;

  // Profit
  netProfit: number;
  profitMargin: number;

  // CAPEX & Equity
  totalCapital: number;
  totalCapexSpent: number;
  sisaKasModal: number;
  bepMonths: string;

  // Investor Dividend Allocations
  investorDividends: Array<Investor & { dividendAmount: number }>;

  // OPEX Percentages for Visual Bars
  opexBreakdown: {
    starlinkPct: number;
    nodePowerPct: number;
    operatorPct: number;
    collectorPct: number;
    marketingPct: number;
    reservePct: number;
  };
}

export function calculateFinancials(
  subscribers: Subscriber[] = [],
  settings: Partial<BusinessSettings> = {},
  investors: Investor[] = [],
  capexItems: CapexItem[] = [],
  expenses: ExpenseTransaction[] = [],
  closings: MonthlyClosing[] = []
): FinancialSummary {
  // Safe defaults
  const starlinkCost = Number(settings.starlink_cost ?? 850000);
  const nodePowerCost = Number(settings.node_power_cost ?? 300000);
  const operatorSalary = Number(settings.operator_salary ?? 1000000);
  const collectorFeePerUser = Number(settings.collector_fee_per_user ?? 5000);
  const marketingFee = Number(settings.marketing_fee_monthly ?? 250000);
  const reserveFundPct = Number(settings.reserve_fund_pct ?? 10.0);

  // Subscribers segmentation
  const activeSubs = subscribers.filter((s) => s.status === 'active');
  const paidSubs = activeSubs.filter((s) => s.payment_status === 'paid');
  const unpaidSubs = activeSubs.filter((s) => s.payment_status === 'unpaid');

  const activeCount = activeSubs.length;
  const paidCount = paidSubs.length;
  const unpaidCount = unpaidSubs.length;

  // Real collected cash in: from paid subscribers
  const totalOmzet = paidSubs.reduce(
    (sum, s) => sum + (Number(s.package_price) || 200000),
    0
  );

  // Total potential if all active subscribers pay
  const totalPotensiOmzet = activeSubs.reduce(
    (sum, s) => sum + (Number(s.package_price) || 200000),
    0
  );

  const uncollectedOmzet = Math.max(0, totalPotensiOmzet - totalOmzet);

  // Collector fee is earned per paid user
  const totalCollectorFee = paidCount * collectorFeePerUser;

  // Reserve fund (10% of real collected cash in for current period)
  const reserveFundAmount = Math.round(totalOmzet * (reserveFundPct / 100));

  // Cumulative reserve fund calculations:
  // 1. From historical monthly closings:
  const historicalReserveAllocated = closings.reduce(
    (sum, c) => sum + (Number(c.reserve_fund_amount) || 0),
    0
  );
  // Total ever allocated to reserve fund
  const totalReserveAllocated = historicalReserveAllocated + reserveFundAmount;

  // 2. Total maintenance spent drawn from reserve fund
  const reserveFundSpent = expenses
    .filter((e) => e.fund_source === 'Kas Dana Cadangan (Maintenance)')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // 3. Current net cumulative reserve fund balance in savings account
  const cumulativeReserveFund = Math.max(0, totalReserveAllocated - reserveFundSpent);

  // Total monthly OPEX (routine monthly running cost + 10% reserve transfer)
  const totalOpex =
    starlinkCost +
    nodePowerCost +
    operatorSalary +
    totalCollectorFee +
    marketingFee +
    reserveFundAmount;

  // Net Profit (never negative for distribution safety)
  const rawNet = totalOmzet - totalOpex;
  const netProfit = Math.max(0, rawNet);

  // Margin
  const profitMargin =
    totalOmzet > 0 ? Number(((netProfit / totalOmzet) * 100).toFixed(1)) : 0;

  // Capital & CAPEX
  const totalCapital = investors.reduce(
    (sum, inv) => sum + (Number(inv.capital_invested) || 0),
    0
  );
  const totalCapexSpent = capexItems.reduce(
    (sum, item) => sum + (Number(item.total_price) || 0),
    0
  );
  const sisaKasModal = Math.max(0, totalCapital - totalCapexSpent);

  // BEP Calculation (Months)
  let bepMonths = '∞';
  if (totalCapexSpent <= 0) {
    bepMonths = '0.0';
  } else if (netProfit > 0) {
    bepMonths = (totalCapexSpent / netProfit).toFixed(1);
  }

  // Investor dividends distribution
  const investorDividends = investors.map((inv) => {
    const share = Number(inv.share_percentage) || 0;
    const dividendAmount = Math.round((netProfit * share) / 100);
    return {
      ...inv,
      dividendAmount,
    };
  });

  // OPEX Percentages for visual bar chart
  const calcPct = (amt: number) =>
    totalOpex > 0 ? Number(((amt / totalOpex) * 100).toFixed(1)) : 0;

  const opexBreakdown = {
    starlinkPct: calcPct(starlinkCost),
    nodePowerPct: calcPct(nodePowerCost),
    operatorPct: calcPct(operatorSalary),
    collectorPct: calcPct(totalCollectorFee),
    marketingPct: calcPct(marketingFee),
    reservePct: calcPct(reserveFundAmount),
  };

  return {
    activeSubs,
    paidSubs,
    unpaidSubs,
    activeCount,
    paidCount,
    unpaidCount,
    totalOmzet,
    totalPotensiOmzet,
    uncollectedOmzet,
    starlinkCost,
    nodePowerCost,
    operatorSalary,
    collectorFeePerUser,
    totalCollectorFee,
    marketingFee,
    reserveFundPct,
    reserveFundAmount,
    cumulativeReserveFund,
    reserveFundSpent,
    totalReserveAllocated,
    totalOpex,
    netProfit,
    profitMargin,
    totalCapital,
    totalCapexSpent,
    sisaKasModal,
    bepMonths,
    investorDividends,
    opexBreakdown,
  };
}
