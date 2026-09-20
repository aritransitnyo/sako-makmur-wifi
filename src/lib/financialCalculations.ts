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

  // OPEX components (synchronized with Buku Kas)
  starlinkCost: number;
  nodePowerCost: number;
  operatorSalary: number;
  collectorFeePerUser: number;
  totalCollectorFee: number;
  marketingFee: number;
  otherOpexCost: number; // Pengeluaran operasional riil lainnya dari Buku Kas (bensin, patroli, sparepart rutin)
  kasOpexTotal: number; // Total kas operasional riil dari Buku Kas
  isSyncedWithKas: boolean; // Flag sinkronisasi Buku Kas vs Dashboard
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
    otherOpexPct: number;
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
  // Safe defaults from business settings / agreements
  const defaultStarlink = Number(settings.starlink_cost ?? 850000);
  const defaultNodePower = Number(settings.node_power_cost ?? 300000);
  const defaultOperator = Number(settings.operator_salary ?? 500000);
  const collectorFeePerUser = Number(settings.collector_fee_per_user ?? 5000);
  const defaultMarketing = Number(settings.marketing_fee_monthly ?? 50000);
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

  // 4. Synchronize with Buku Kas (Kas Operasional)
  // Single Source of Truth: Operational expenditures recorded in Buku Kas
  const opexExpenses = expenses.filter(
    (e) => e.type !== 'income' && (!e.fund_source || e.fund_source === 'Kas Operasional')
  );

  const hasKasRecords = opexExpenses.length > 0;

  let starlinkCost = 0;
  let nodePowerCost = 0;
  let operatorSalary = 0;
  let totalCollectorFee = 0;
  let marketingFee = 0;
  let otherOpexCost = 0;

  let hasStarlinkRecord = false;
  let hasNodePowerRecord = false;
  let hasOperatorRecord = false;
  let hasCollectorRecord = false;
  let hasMarketingRecord = false;

  if (hasKasRecords) {
    opexExpenses.forEach((e) => {
      const cat = (e.category || '').toLowerCase();
      const desc = (e.description || '').toLowerCase();
      const amt = Number(e.amount) || 0;

      if (cat.includes('starlink') || desc.includes('starlink')) {
        starlinkCost += amt;
        hasStarlinkRecord = true;
      } else if (
        cat.includes('listrik') ||
        cat.includes('token') ||
        desc.includes('listrik') ||
        desc.includes('token') ||
        desc.includes('pln')
      ) {
        nodePowerCost += amt;
        hasNodePowerRecord = true;
      } else if (
        cat.includes('gaji') ||
        cat.includes('operator') ||
        desc.includes('gaji operator')
      ) {
        operatorSalary += amt;
        hasOperatorRecord = true;
      } else if (
        cat.includes('tagih') ||
        desc.includes('jasa tagih') ||
        desc.includes('kolektor')
      ) {
        totalCollectorFee += amt;
        hasCollectorRecord = true;
      } else if (
        cat.includes('marketing') ||
        desc.includes('marketing') ||
        desc.includes('promosi') ||
        desc.includes('komisi')
      ) {
        marketingFee += amt;
        hasMarketingRecord = true;
      } else {
        otherOpexCost += amt;
      }
    });
  }

  // Fallback for standard items if not yet registered in Buku Kas
  if (!hasStarlinkRecord) starlinkCost = defaultStarlink;
  if (!hasNodePowerRecord) nodePowerCost = defaultNodePower;
  if (!hasOperatorRecord) operatorSalary = defaultOperator;
  if (!hasCollectorRecord) totalCollectorFee = paidCount * collectorFeePerUser;
  if (!hasMarketingRecord) marketingFee = defaultMarketing;

  // Real operational expenses total from Buku Kas:
  const kasOpexTotal = opexExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // If Buku Kas has records, we use the real cash spent in Buku Kas plus any unrecorded routine baseline
  const unrecordedRoutine =
    (!hasStarlinkRecord ? defaultStarlink : 0) +
    (!hasNodePowerRecord ? defaultNodePower : 0) +
    (!hasOperatorRecord ? defaultOperator : 0) +
    (!hasCollectorRecord ? paidCount * collectorFeePerUser : 0) +
    (!hasMarketingRecord ? defaultMarketing : 0);

  const realOperationalSum = hasKasRecords
    ? kasOpexTotal + unrecordedRoutine
    : starlinkCost + nodePowerCost + operatorSalary + totalCollectorFee + marketingFee;

  // Total monthly OPEX (Operational expenses + 10% reserve transfer)
  const totalOpex = realOperationalSum + reserveFundAmount;

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
    otherOpexPct: calcPct(otherOpexCost),
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
    otherOpexCost,
    kasOpexTotal,
    isSyncedWithKas: hasKasRecords,
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
