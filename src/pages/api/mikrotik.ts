/**
 * /api/mikrotik - Server-side proxy to MikroTik RouterOS API
 * 
 * Dual-mode:
 *  - LOCAL: Direct TCP to MikroTik via mikrotikApi.ts (when MIKROTIK_API_HOST is set)
 *  - VERCEL: HTTP proxy via VPS bridge (when MIKROTIK_BRIDGE_URL is set)
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

// Bridge URL for Vercel deployment (VPS HTTP-to-TCP proxy)
const BRIDGE_URL = process.env.MIKROTIK_BRIDGE_URL || 'http://49.12.82.34:10887';
const BRIDGE_KEY = process.env.MIKROTIK_BRIDGE_KEY || '3oR6TBDJQqTt2iykOysTHBWsAQh69TlbCXT07vndbCE';

// Check if we should use direct TCP or HTTP bridge
const USE_BRIDGE = !!BRIDGE_URL;

/**
 * Forward request to VPS bridge via HTTP
 */
async function bridgeRequest(action: string, params: Record<string, any> = {}): Promise<any> {
  const url = new URL(BRIDGE_URL);

  if (action === 'test' || action === 'status' || action === 'secrets' ||
      action === 'profiles' || action === 'traffic') {
    // GET requests
    url.searchParams.set('action', action);
    url.searchParams.set('key', BRIDGE_KEY);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
    const resp = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'X-Api-Key': BRIDGE_KEY },
    });
    return resp.json();
  } else {
    // POST requests (kick, isolir, enable)
    url.searchParams.set('key', BRIDGE_KEY);
    const resp = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': BRIDGE_KEY,
      },
      body: JSON.stringify({ action, ...params }),
    });
    return resp.json();
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers
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
    if (USE_BRIDGE) {
      // ===== BRIDGE MODE (Vercel → VPS → MikroTik) =====
      let params: Record<string, any> = {};
      
      switch (action) {
        case 'traffic':
          params.interface = req.query.interface || req.body?.interface || 'ether1-WAN';
          break;
        case 'kick':
          if (req.method !== 'POST') {
            return res.status(405).json({ status: 'error', message: 'POST required for kick' });
          }
          params.sessionId = req.body?.sessionId;
          if (!params.sessionId) {
            return res.status(400).json({ status: 'error', message: 'Missing sessionId' });
          }
          break;
        case 'isolir':
          if (req.method !== 'POST') {
            return res.status(405).json({ status: 'error', message: 'POST required for isolir' });
          }
          params.secretId = req.body?.secretId;
          params.profile = req.body?.profile;
          if (!params.secretId || !params.profile) {
            return res.status(400).json({ status: 'error', message: 'Missing secretId or profile' });
          }
          break;
        case 'enable':
          if (req.method !== 'POST') {
            return res.status(405).json({ status: 'error', message: 'POST required for enable' });
          }
          params.secretId = req.body?.secretId;
          params.disabled = req.body?.disabled;
          if (!params.secretId || params.disabled === undefined) {
            return res.status(400).json({ status: 'error', message: 'Missing secretId or disabled' });
          }
          break;
      }

      const bridgeResp = await bridgeRequest(action, params);
      return res.status(200).json(bridgeResp);

    } else {
      // ===== DIRECT TCP MODE (local dev) =====
      const {
        testConnection,
        getActivePppoe,
        getPppoeSecrets,
        getPppoeProfiles,
        getInterfaceTraffic,
        getSystemResource,
        kickPppoeSession,
        changePppoeProfile,
        setPppoeDisabled,
      } = await import('../../lib/mikrotikApi');

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
          return res.status(200).json({ status: 'success', message: `Profile changed to ${profile}` });
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
          return res.status(200).json({ status: 'success', message: `Secret ${disabled ? 'disabled' : 'enabled'}` });
        }
        default:
          return res.status(400).json({ status: 'error', message: `Unknown action: ${action}` });
      }
    }
  } catch (err: any) {
    console.error('[MikroTik API Error]', err.message);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'MikroTik API error',
    });
  }
}
