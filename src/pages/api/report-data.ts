import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';
import { getServerState } from '../../lib/serverState';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Fetch settings from Supabase
    const { data: settingsData } = await supabase
      .from('business_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    const fallbackState = getServerState();
    const settings = settingsData || fallbackState.settings;

    // 2. Fetch investors from Supabase
    const { data: investorsData } = await supabase
      .from('investors')
      .select('*')
      .order('capital_invested', { ascending: false });

    const investors = investorsData && investorsData.length > 0 ? investorsData : fallbackState.investors;

    // 3. Fetch subscribers from Supabase
    const { data: subsData } = await supabase
      .from('subscribers')
      .select('*')
      .order('created_at', { ascending: true });

    const subscribers = subsData && subsData.length > 0 ? subsData : fallbackState.subscribers;

    // 4. Fetch capex from Supabase
    const { data: capexData } = await supabase
      .from('capex_items')
      .select('*');

    const capex = capexData && capexData.length > 0 ? capexData : fallbackState.capex;
    const closings = fallbackState.closings || [];
    const expenses = fallbackState.expenses || [];

    // Calculations
    const activeSubs = subscribers.filter((s: any) => s.status === 'active');
    const paidSubs = activeSubs.filter((s: any) => s.payment_status === 'paid');

    const totalOmzet = paidSubs.reduce(
      (sum: number, s: any) => sum + (Number(s.package_price) || 200000),
      0
    );

    const collectorFeePerUser = Number(settings.collector_fee_per_user) || 5000;
    const totalCollectorFee = paidSubs.length * collectorFeePerUser;
    const marketingFee = Number(settings.marketing_fee_monthly) || 250000;
    const reserveFundPct = Number(settings.reserve_fund_pct) || 10.0;
    const reserveFundAmount = Math.round(totalOmzet * (reserveFundPct / 100));

    // Cumulative reserve fund calculations
    const historicalReserve = closings.reduce(
      (sum: number, c: any) => sum + (Number(c.reserve_fund_amount) || 0),
      0
    );
    const totalReserveAllocated = historicalReserve + reserveFundAmount;
    const reserveFundSpent = expenses
      .filter((e: any) => e.fund_source === 'Kas Dana Cadangan (Maintenance)')
      .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
    const cumulativeReserveFund = Math.max(0, totalReserveAllocated - reserveFundSpent);

    const totalOpex =
      Number(settings.starlink_cost) +
      Number(settings.node_power_cost) +
      Number(settings.operator_salary) +
      totalCollectorFee +
      marketingFee +
      reserveFundAmount;

    const netProfit = Math.max(0, totalOmzet - totalOpex);

    const investorDividends = investors.map((inv: any) => ({
      ...inv,
      dividend_amount: Math.round((netProfit * Number(inv.share_percentage)) / 100),
    }));

    const totalModal = investors.reduce((sum: number, i: any) => sum + Number(i.capital_invested), 0);
    const totalCapexSpent = capex.reduce((sum: number, c: any) => sum + Number(c.total_price), 0);
    const sisaKasModal = Math.max(0, totalModal - totalCapexSpent);

    return res.status(200).json({
      status: 'success',
      source: settingsData ? 'supabase_live' : 'server_cache',
      business_name: settings.business_name,
      total_modal: totalModal,
      capex_spent: totalCapexSpent,
      sisa_kas_modal: sisaKasModal,
      total_subscribers_count: subscribers.length,
      active_subscribers_count: activeSubs.length,
      paid_subscribers_count: paidSubs.length,
      total_omzet: totalOmzet,
      starlink_cost: Number(settings.starlink_cost),
      node_power_cost: Number(settings.node_power_cost),
      operator_salary: Number(settings.operator_salary),
      collector_fee: totalCollectorFee,
      collector_fee_per_user: collectorFeePerUser,
      marketing_fee: marketingFee,
      reserve_fund_pct: reserveFundPct,
      reserve_fund_amount: reserveFundAmount,
      cumulative_reserve_fund: cumulativeReserveFund,
      reserve_fund_spent: reserveFundSpent,
      total_reserve_allocated: totalReserveAllocated,
      total_opex: totalOpex,
      net_profit: netProfit,
      investors: investorDividends,
      subscribers: subscribers.map((s: any) => ({
        name: s.full_name,
        username: s.username_pppoe,
        package: s.package_name,
        price: Number(s.package_price),
        status: s.status,
        payment: s.payment_status,
        address: s.address,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
