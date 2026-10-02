import type { NextApiRequest, NextApiResponse } from 'next';
import { isAuthenticated } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  const authenticated = isAuthenticated(req);

  return res.status(200).json({
    status: 'success',
    authenticated,
  });
}
