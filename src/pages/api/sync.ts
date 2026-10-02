import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerState, updateServerState } from '../../lib/serverState';
import { isAuthenticated } from '../../lib/auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Security Check: Hanya izinkan akses terautentikasi
  if (!isAuthenticated(req)) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: Akses ditolak. Sesi autentikasi tidak valid atau belum login.',
    });
  }

  if (req.method === 'POST') {
    try {
      const { settings, investors, subscribers, expenses, capex, closings } = req.body || {};
      
      // Jika ada settings, pastikan admin_pin tidak di-overwrite sembarangan oleh client
      const safeSettings = settings ? { ...settings } : undefined;
      if (safeSettings && 'admin_pin' in safeSettings) {
        delete safeSettings.admin_pin;
      }

      const updated = updateServerState({
        ...(safeSettings ? { settings: safeSettings } : {}),
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
  const rawState = getServerState();
  
  // Sanitasi data sensitif sebelum dikirim ke frontend
  const safeState = JSON.parse(JSON.stringify(rawState));
  if (safeState?.settings?.admin_pin) {
    delete safeState.settings.admin_pin;
  }
  
  // Hapus pppoe_password jika ada agar tidak bocor ke browser
  if (Array.isArray(safeState?.subscribers)) {
    safeState.subscribers = safeState.subscribers.map((sub: any) => {
      const { pppoe_password, ...rest } = sub;
      return rest;
    });
  }

  return res.status(200).json({
    status: 'success',
    state: safeState,
  });
}
