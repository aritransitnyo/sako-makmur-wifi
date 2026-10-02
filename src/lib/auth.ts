import type { NextApiRequest, NextApiResponse } from 'next';
import * as crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'sako-makmur-netos-secret-session-2026-auth';
const API_SECRET_KEY = process.env.API_SECRET_KEY || process.env.MIKROTIK_BRIDGE_KEY || '3oR6TBDJQqTt2iykOysTHBWsAQh69TlbCXT07vndbCE';
const ADMIN_PIN = process.env.ADMIN_PIN || '140320';

export interface SessionPayload {
  role: 'admin';
  iat: number;
  exp: number;
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf-8');
}

/**
 * Buat cryptographically-signed HMAC session token (valid 7 hari)
 */
export function createSessionToken(): string {
  const payload: SessionPayload = {
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 86400, // 7 days
  };

  const payloadStr = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadStr)
    .digest('base64url');

  return `${payloadStr}.${signature}`;
}

/**
 * Verifikasi HMAC signature dan expired time dari session token
 */
export function verifySessionToken(token?: string): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadStr, signature] = parts;

  try {
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payloadStr)
      .digest('base64url');

    // Timing-safe comparison to prevent timing attacks
    if (signature.length !== expectedSig.length) return false;
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;

    const payload: SessionPayload = JSON.parse(base64UrlDecode(payloadStr));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return false;

    return payload.role === 'admin';
  } catch {
    return false;
  }
}

/**
 * Helper untuk parse cookie header
 */
export function parseCookies(req: NextApiRequest): Record<string, string> {
  const list: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts[0]?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.slice(1).join('=').trim());
    }
  });

  return list;
}

/**
 * Periksa apakah request terautentikasi (Cookie session ATAU API Key header)
 */
export function isAuthenticated(req: NextApiRequest): boolean {
  // 1. Cek HttpOnly cookie smw_session
  const cookies = parseCookies(req);
  if (cookies.smw_session && verifySessionToken(cookies.smw_session)) {
    return true;
  }

  // 2. Cek Header X-API-Key atau Authorization Bearer (untuk script otomatis / eksternal)
  const apiKeyHeader = req.headers['x-api-key'];
  if (typeof apiKeyHeader === 'string' && apiKeyHeader.trim() === API_SECRET_KEY.trim()) {
    return true;
  }

  const authHeader = req.headers['authorization'];
  if (typeof authHeader === 'string') {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token === API_SECRET_KEY.trim()) {
      return true;
    }
  }

  return false;
}

/**
 * Verifikasi PIN admin
 */
export function verifyAdminPin(pin: string): boolean {
  if (!pin || typeof pin !== 'string') return false;
  const cleanPin = pin.trim();
  const targetPin = ADMIN_PIN.trim();

  // Timing safe equal jika panjang sama
  if (cleanPin.length !== targetPin.length) return false;
  return crypto.timingSafeEqual(Buffer.from(cleanPin), Buffer.from(targetPin));
}

/**
 * Set HttpOnly cookie smw_session ke response
 */
export function setSessionCookie(req: NextApiRequest, res: NextApiResponse, token: string): void {
  const isHttps = req.headers['x-forwarded-proto'] === 'https' || (req.socket as any)?.encrypted;
  const cookieVal = `smw_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${isHttps ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookieVal);
}

/**
 * Clear HttpOnly cookie smw_session
 */
export function clearSessionCookie(req: NextApiRequest, res: NextApiResponse): void {
  const isHttps = req.headers['x-forwarded-proto'] === 'https' || (req.socket as any)?.encrypted;
  const cookieVal = `smw_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isHttps ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookieVal);
}
