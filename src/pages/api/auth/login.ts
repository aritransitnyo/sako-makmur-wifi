import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminPin, createSessionToken, setSessionCookie } from '../../../lib/auth';

// Rate limiting in-memory: max 5 failed attempts per 60 seconds per IP
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  const clientIp = getClientIp(req);
  const now = Date.now();
  const attemptRecord = failedAttempts.get(clientIp);

  if (attemptRecord && attemptRecord.resetAt > now) {
    if (attemptRecord.count >= 5) {
      const waitSec = Math.ceil((attemptRecord.resetAt - now) / 1000);
      return res.status(429).json({
        status: 'error',
        message: `Terlalu banyak percobaan gagal. Silakan tunggu ${waitSec} detik lagi.`,
      });
    }
  } else if (attemptRecord && attemptRecord.resetAt <= now) {
    failedAttempts.delete(clientIp);
  }

  const { pin } = req.body || {};

  if (!pin || typeof pin !== 'string') {
    return res.status(400).json({ status: 'error', message: 'PIN wajib diisi.' });
  }

  const isValid = verifyAdminPin(pin);

  if (!isValid) {
    const current = failedAttempts.get(clientIp) || { count: 0, resetAt: now + 60000 };
    failedAttempts.set(clientIp, {
      count: current.count + 1,
      resetAt: current.resetAt,
    });

    return res.status(401).json({
      status: 'error',
      message: 'PIN Salah. Silakan periksa kembali.',
    });
  }

  // Berhasil: reset failed attempts
  failedAttempts.delete(clientIp);

  const token = createSessionToken();
  setSessionCookie(req, res, token);

  return res.status(200).json({
    status: 'success',
    message: 'Autentikasi berhasil.',
  });
}
