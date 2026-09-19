/**
 * /api/mikrotik - Server-side proxy to MikroTik RouterOS API
 * 
 * All MikroTik communication goes through this endpoint to keep
 * credentials and tunnel details server-side only.
 * 
 * Actions:
 *  GET  ?action=status       → active PPPoE sessions + system info
 *  GET  ?action=secrets      → all PPPoE secrets  
 *  GET  ?action=profiles     → all PPPoE profiles
 *  GET  ?action=test         → test API connectivity
 *  GET  ?action=traffic&interface=<name> → live traffic for interface
 *  POST {action: "kick", sessionId: "..."}  → disconnect active PPPoE
 *  POST {action: "isolir", secretId: "...", profile: "..."}  → change profile
 *  POST {action: "enable", secretId: "...", disabled: bool}  → enable/disable secret
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  testConnection,
  getActivePppoe,
  getPppoeSecrets,
  getPppoeProfiles,
  getInterfaceTraffic,
  getSystemResource,
  kickPppoeSession,
  changePppoeProfile,
  setPppoeDisabled,
} from '../../lib/mikrotikApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  if (!action) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing action parameter. Use: test, status, secrets, profiles, traffic, kick, isolir, enable',
    });
  }

  try {
    switch (action) {
      case 'test': {
        const result = await testConnection();
        return res.status(200).json({ status: 'success', ...result });
      }

      case 'status': {
        const [activeSessions, resource] = await Promise.all([
          getActivePppoe(),
          getSystemResource(),
        ]);
        return res.status(200).json({
          status: 'success',
          active_sessions: activeSessions,
          router: resource ? {
            uptime: resource['uptime'] || '',
            version: resource['version'] || '',
            cpu_load: resource['cpu-load'] || '',
            free_memory: resource['free-memory'] || '',
            total_memory: resource['total-memory'] || '',
            board_name: resource['board-name'] || '',
          } : null,
        });
      }

      case 'secrets': {
        const secrets = await getPppoeSecrets();
        return res.status(200).json({ status: 'success', secrets });
      }

      case 'profiles': {
        const profiles = await getPppoeProfiles();
        return res.status(200).json({
          status: 'success',
          profiles: profiles.map(p => ({
            id: p['.id'] || '',
            name: p['name'] || '',
            rateLimit: p['rate-limit'] || '',
            localAddress: p['local-address'] || '',
            remoteAddress: p['remote-address'] || '',
          })),
        });
      }

      case 'traffic': {
        const ifName = (req.query.interface || req.body?.interface || 'ether1-WAN') as string;
        const traffic = await getInterfaceTraffic(ifName);
        return res.status(200).json({ status: 'success', traffic });
      }

      case 'kick': {
        if (req.method !== 'POST') {
          return res.status(405).json({ status: 'error', message: 'POST required for kick' });
        }
        const { sessionId } = req.body;
        if (!sessionId) {
          return res.status(400).json({ status: 'error', message: 'Missing sessionId' });
        }
        await kickPppoeSession(sessionId);
        return res.status(200).json({ status: 'success', message: `Session ${sessionId} disconnected` });
      }

      case 'isolir': {
        if (req.method !== 'POST') {
          return res.status(405).json({ status: 'error', message: 'POST required for isolir' });
        }
        const { secretId, profile } = req.body;
        if (!secretId || !profile) {
          return res.status(400).json({ status: 'error', message: 'Missing secretId or profile' });
        }
        await changePppoeProfile(secretId, profile);
        return res.status(200).json({
          status: 'success',
          message: `Profile changed to ${profile}`,
        });
      }

      case 'enable': {
        if (req.method !== 'POST') {
          return res.status(405).json({ status: 'error', message: 'POST required for enable' });
        }
        const { secretId: sid, disabled } = req.body;
        if (!sid || disabled === undefined) {
          return res.status(400).json({ status: 'error', message: 'Missing secretId or disabled' });
        }
        await setPppoeDisabled(sid, disabled);
        return res.status(200).json({
          status: 'success',
          message: `Secret ${disabled ? 'disabled' : 'enabled'}`,
        });
      }

      default:
        return res.status(400).json({
          status: 'error',
          message: `Unknown action: ${action}`,
        });
    }
  } catch (err: any) {
    console.error('[MikroTik API Error]', err.message);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'MikroTik API error',
    });
  }
}
