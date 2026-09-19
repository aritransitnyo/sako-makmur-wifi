import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerState } from '../../lib/serverState';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const state = getServerState();
  const settings = state.settings;
  const investors = state.investors;
  const subscribers = state.subscribers;
  const expenses = state.expenses;
  const capex = state.capex;

  // Real calculations
  const activeSubs = subscribers.filter((s) => s.status === 'active');
  const paidSubs = activeSubs.filter((s) => s.payment_status === 'paid');

  const totalOmzet = paidSubs.reduce(
    (sum, s) => sum + (s.package_price || 200000),
    0
  );

  const collectorFeePerUser = settings.collector_fee_per_user ?? 5000;
  const totalCollectorFee = paidSubs.length * collectorFeePerUser;
  const marketingFee = settings.marketing_fee_monthly ?? 250000;
  const reserveFundPct = settings.reserve_fund_pct ?? 10.0;
  const reserveFundAmount = Math.round(totalOmzet * (reserveFundPct / 100));

  const totalOpex =
    settings.starlink_cost +
    settings.node_power_cost +
    settings.operator_salary +
    totalCollectorFee +
    marketingFee +
    reserveFundAmount;

  const netProfit = Math.max(0, totalOmzet - totalOpex);

  const investorDividends = investors.map((inv) => ({
    ...inv,
    dividend_amount: Math.round((netProfit * inv.share_percentage) / 100),
  }));

  const totalModal = investors.reduce((sum, i) => sum + i.capital_invested, 0);
  const totalCapexSpent = capex.reduce((sum, c) => sum + c.total_price, 0);
  const sisaKasModal = Math.max(0, totalModal - totalCapexSpent);

  return res.status(200).json({
    status: 'success',
    business_name: settings.business_name,
    total_modal: totalModal,
    capex_spent: totalCapexSpent,
    sisa_kas_modal: sisaKasModal,
    total_subscribers_count: subscribers.length,
    active_subscribers_count: activeSubs.length,
    paid_subscribers_count: paidSubs.length,
    total_omzet: totalOmzet,
    starlink_cost: settings.starlink_cost,
    node_power_cost: settings.node_power_cost,
    operator_salary: settings.operator_salary,
    collector_fee: totalCollectorFee,
    collector_fee_per_user: collectorFeePerUser,
    marketing_fee: marketingFee,
    reserve_fund_pct: reserveFundPct,
    reserve_fund_amount: reserveFundAmount,
    total_opex: totalOpex,
    net_profit: netProfit,
    investors: investorDividends,
    subscribers: subscribers.map((s) => ({
      name: s.full_name,
      username: s.username_pppoe,
      package: s.package_name,
      price: s.package_price,
      status: s.status,
      payment: s.payment_status,
      address: s.address,
    })),
  });
}
