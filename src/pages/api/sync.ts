import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerState, updateServerState } from '../../lib/serverState';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { settings, investors, subscribers, expenses, capex, closings } = req.body || {};
      const updated = updateServerState({
        ...(settings ? { settings } : {}),
        ...(investors ? { investors } : {}),
        ...(subscribers ? { subscribers } : {}),
        ...(expenses ? { expenses } : {}),
        ...(capex ? { capex } : {}),
        ...(closings ? { closings } : {}),
      });
      return res.status(200).json({ status: 'success', synced_at: updated.last_synced_at });
    } catch (e: any) {
      return res.status(400).json({ status: 'error', message: e.message });
    }
  }

  // GET
  const state = getServerState();
  return res.status(200).json({
    status: 'success',
    state,
  });
}
