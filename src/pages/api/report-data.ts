import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';
import { getServerState } from '../../lib/serverState';
import { isAuthenticated } from '../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Security Check: Hanya izinkan akses terautentikasi (HttpOnly session cookie atau X-API-Key)
  if (!isAuthenticated(req)) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: Akses ditolak. Token API atau sesi tidak valid.',
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    const { period } = req.query; // 'active' | 'latest_closed' | '2026-09' | etc.

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

    // 3. Fetch monthly closings from Supabase
    const { data: closingsData } = await supabase
      .from('monthly_closings')
      .select('*')
      .order('closed_at', { ascending: false });

    const closings = closingsData && closingsData.length > 0 ? closingsData : (fallbackState.closings || []);
    const latestClosing = closings[0] || null;

    // 4. Fetch subscribers from Supabase
    const { data: subsData } = await supabase
      .from('subscribers')
      .select('*')
      .order('created_at', { ascending: true });

    const subscribers = subsData && subsData.length > 0 ? subsData : fallbackState.subscribers;

    // 5. Fetch capex from Supabase
    const { data: capexData } = await supabase
      .from('capex_items')
      .select('*');

    const capex = capexData && capexData.length > 0 ? capexData : fallbackState.capex;

    // 6. Fetch expenses from Supabase
    const { data: expData } = await supabase
      .from('expenses')
      .select('*');
    const expenses = expData && expData.length > 0 ? expData : (fallbackState.expenses || []);

    // 7. Operational cycle status
    const now = new Date();
    const currentDay = now.getDate();
    const currentCalKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(now);

    let cyclePhase = 'Masa Persiapan Tagihan (Tagihan Terbit Tgl 10)';
    if (currentDay >= 25) {
      cyclePhase = 'Masa Tutup Buku & Bagi Dividen (Tgl 25 - Akhir Bulan)';
    } else if (currentDay >= 18) {
      cyclePhase = 'Masa Jatuh Tempo & Penertiban Isolir Manual (Tgl 18 - 24)';
    } else if (currentDay >= 10) {
      cyclePhase = 'Masa Penagihan Aktif (Tgl 10 - 17)';
    }

    // Calculations for Active Period (e.g. Oktober 2026)
    const activeSubs = subscribers.filter((s: any) => s.status === 'active');
    const paidSubs = activeSubs.filter((s: any) => s.payment_status === 'paid');
    const unpaidSubs = activeSubs.filter((s: any) => s.payment_status === 'unpaid');

    const totalActivePotensi = activeSubs.reduce(
      (sum: number, s: any) => sum + (Number(s.package_price) || 200000),
      0
    );

    const activeOmzet = paidSubs.reduce(
      (sum: number, s: any) => sum + (Number(s.package_price) || 200000),
      0
    );

    const collectorFeePerUser = Number(settings.collector_fee_per_user) || 5000;
    const activeCollectorFee = paidSubs.length * collectorFeePerUser;
    const marketingFee = Number(settings.marketing_fee_monthly) || 50000;
    const reserveFundPct = Number(settings.reserve_fund_pct) || 10.0;
    const activeReserveFund = Math.round(activeOmzet * (reserveFundPct / 100));

    // Cumulative reserve fund calculations
    const historicalReserve = closings.reduce(
      (sum: number, c: any) => sum + (Number(c.reserve_fund_amount) || 0),
      0
    );
    const totalReserveAllocated = historicalReserve + activeReserveFund;
    const reserveFundSpent = expenses
      .filter((e: any) => e.fund_source === 'Kas Dana Cadangan (Maintenance)')
      .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
    const cumulativeReserveFund = Math.max(0, totalReserveAllocated - reserveFundSpent);

    // Active period OPEX
    const opexExpenses = expenses.filter(
      (e: any) => e.type !== 'income' && (!e.fund_source || e.fund_source === 'Kas Operasional')
    );
    const kasOpexTotal = opexExpenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);

    const activeTotalOpex = (opexExpenses.length > 0
      ? kasOpexTotal
      : Number(settings.starlink_cost || 850000) +
        Number(settings.node_power_cost || 300000) +
        Number(settings.operator_salary || 500000) +
        activeCollectorFee +
        marketingFee) + activeReserveFund;

    const activeNetProfit = Math.max(0, activeOmzet - activeTotalOpex);

    // Masked bank accounts helper
    const maskAccount = (acc: string) => {
      const s = String(acc || '').trim();
      return s.length > 6 ? `${s.slice(0, 4)}****${s.slice(-2)}` : s;
    };

    // If caller specifically requested latest closed month (e.g. September 2026)
    const isRequestingClosed = period === 'latest_closed' || (latestClosing && period === latestClosing.period_key);

    const targetOmzet = isRequestingClosed && latestClosing ? Number(latestClosing.gross_revenue) : activeOmzet;
    const targetOpex = isRequestingClosed && latestClosing ? Number(latestClosing.total_expenses) : activeTotalOpex;
    const targetNetProfit = isRequestingClosed && latestClosing ? Number(latestClosing.net_profit) : activeNetProfit;
    const targetPeriodMonth = isRequestingClosed && latestClosing ? latestClosing.period_month : currentMonthName;
    const targetPeriodKey = isRequestingClosed && latestClosing ? latestClosing.period_key : currentCalKey;

    const targetDividends = isRequestingClosed && latestClosing && latestClosing.investor_dividends
      ? latestClosing.investor_dividends.map((inv: any) => {
          const liveInv = investors.find((item: any) => item.id === inv.investor_id || item.name === inv.name);
          return {
            ...inv,
            bank_name: inv.bank_name || liveInv?.bank_name,
            account_number: maskAccount(inv.account_number || liveInv?.account_number || ''),
            dividend_amount: Number(inv.dividend_amount),
            paid_status: inv.paid_status || 'paid',
          };
        })
      : investors.map((inv: any) => ({
          investor_id: inv.id,
          name: inv.name,
          role: inv.role,
          share_percentage: Number(inv.share_percentage),
          bank_name: inv.bank_name,
          account_number: maskAccount(inv.account_number || ''),
          dividend_amount: Math.round((activeNetProfit * Number(inv.share_percentage)) / 100),
          paid_status: 'pending',
        }));

    const totalModal = investors.reduce((sum: number, i: any) => sum + Number(i.capital_invested), 0);
    const totalCapexSpent = capex.reduce((sum: number, c: any) => sum + Number(c.total_price), 0);
    const sisaKasModal = Math.max(0, totalModal - totalCapexSpent);

    return res.status(200).json({
      status: 'success',
      source: settingsData ? 'supabase_live' : 'server_cache',
      business_name: settings.business_name,
      period_month: targetPeriodMonth,
      period_key: targetPeriodKey,
      is_closed: isRequestingClosed,
      report_period_month: targetPeriodMonth,
      report_period_key: targetPeriodKey,
      is_closed_period: isRequestingClosed,

      // High-level financial metrics
      total_modal: totalModal,
      capex_spent: totalCapexSpent,
      sisa_kas_modal: sisaKasModal,
      total_omzet: targetOmzet,
      total_opex: targetOpex,
      net_profit: targetNetProfit,
      reserve_fund_pct: reserveFundPct,
      cumulative_reserve_fund: cumulativeReserveFund,
      total_reserve_allocated: totalReserveAllocated,
      reserve_fund_spent: reserveFundSpent,

      // Subscriber counts
      total_subscribers_count: subscribers.length,
      active_subscribers_count: activeSubs.length,
      paid_subscribers_count: isRequestingClosed && latestClosing ? Number(latestClosing.paid_subscribers_count) : paidSubs.length,
      unpaid_subscribers_count: isRequestingClosed ? 0 : unpaidSubs.length,
      potential_omzet: totalActivePotensi,

      // Cost details
      starlink_cost: Number(settings.starlink_cost),
      node_power_cost: Number(settings.node_power_cost),
      operator_salary: Number(settings.operator_salary),
      collector_fee_per_user: collectorFeePerUser,
      collector_fee: isRequestingClosed ? (Number(latestClosing?.paid_subscribers_count || 0) * collectorFeePerUser) : activeCollectorFee,
      marketing_fee: marketingFee,

      // Investor dividend list
      investors: targetDividends,

      // Detailed structures for clean multi-period reporting
      latest_closed_period: latestClosing ? {
        period_key: latestClosing.period_key,
        period_month: latestClosing.period_month,
        closed_at: latestClosing.closed_at,
        closed_by: latestClosing.closed_by,
        gross_revenue: Number(latestClosing.gross_revenue),
        total_expenses: Number(latestClosing.total_expenses),
        reserve_fund_amount: Number(latestClosing.reserve_fund_amount),
        net_profit: Number(latestClosing.net_profit),
        paid_subscribers_count: Number(latestClosing.paid_subscribers_count),
        active_subscribers_count: Number(latestClosing.active_subscribers_count),
        investor_dividends: (latestClosing.investor_dividends || []).map((d: any) => ({
          ...d,
          account_number: maskAccount(d.account_number || ''),
        })),
        notes: latestClosing.notes,
      } : null,

      active_period_status: {
        period_key: currentCalKey,
        period_month: currentMonthName,
        cycle_phase: cyclePhase,
        current_day: currentDay,
        active_subscribers_count: activeSubs.length,
        paid_subscribers_count: paidSubs.length,
        unpaid_subscribers_count: unpaidSubs.length,
        collected_omzet: activeOmzet,
        potential_omzet: totalActivePotensi,
        uncollected_omzet: Math.max(0, totalActivePotensi - activeOmzet),
        dividends_status: 'Kalkulasi resmi & transfer dividen akan dikunci pada tanggal 25 setelah penagihan selesai',
      },

      subscribers: subscribers.map((s: any) => ({
        name: s.full_name,
        username: s.username_pppoe,
        package: s.package_name,
        price: Number(s.package_price),
        status: s.status,
        payment: s.payment_status,
        last_paid_at: s.last_paid_at,
        address: s.address,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
