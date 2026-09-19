/**
 * MikroTik RouterOS API Client (Server-Side Only)
 * 
 * Implements the MikroTik API binary protocol over TCP.
 * Used exclusively in Next.js API routes — never client-side.
 * 
 * Protocol: https://help.mikrotik.com/docs/display/ROS/API
 */

import * as net from 'net';
import * as crypto from 'crypto';

// Connection settings — read from env with safe defaults
const MT_HOST = process.env.MIKROTIK_API_HOST || 'idn32.tunnel.id';
const MT_PORT = parseInt(process.env.MIKROTIK_API_PORT || '3201', 10);
const MT_USER = process.env.MIKROTIK_API_USER || 'admin';
const MT_PASS = process.env.MIKROTIK_API_PASS || '';
const MT_TIMEOUT = parseInt(process.env.MIKROTIK_API_TIMEOUT || '8000', 10);

/** Encode a single word into MikroTik API wire format */
function encodeLength(len: number): Buffer {
  if (len < 0x80) {
    return Buffer.from([len]);
  } else if (len < 0x4000) {
    const adjusted = len | 0x8000;
    const buf = Buffer.alloc(2);
    buf.writeUInt16BE(adjusted, 0);
    return buf;
  } else if (len < 0x200000) {
    const adjusted = len | 0xc00000;
    const buf = Buffer.alloc(3);
    buf[0] = (adjusted >> 16) & 0xff;
    buf[1] = (adjusted >> 8) & 0xff;
    buf[2] = adjusted & 0xff;
    return buf;
  } else if (len < 0x10000000) {
    const adjusted = len | 0xe0000000;
    const buf = Buffer.alloc(4);
    buf.writeUInt32BE(adjusted, 0);
    return buf;
  } else {
    const buf = Buffer.alloc(5);
    buf[0] = 0xf0;
    buf.writeUInt32BE(len, 1);
    return buf;
  }
}

function encodeWord(word: string): Buffer {
  const wordBuf = Buffer.from(word, 'utf-8');
  return Buffer.concat([encodeLength(wordBuf.length), wordBuf]);
}

/** Decode the length prefix from a buffer starting at offset */
function decodeLength(buf: Buffer, offset: number): { length: number; bytesRead: number } {
  const b = buf[offset];
  if ((b & 0x80) === 0) {
    return { length: b, bytesRead: 1 };
  } else if ((b & 0xc0) === 0x80) {
    const val = buf.readUInt16BE(offset) & 0x3fff;
    return { length: val, bytesRead: 2 };
  } else if ((b & 0xe0) === 0xc0) {
    const val = ((buf[offset] & 0x1f) << 16) | (buf[offset + 1] << 8) | buf[offset + 2];
    return { length: val, bytesRead: 3 };
  } else if ((b & 0xf0) === 0xe0) {
    const val = buf.readUInt32BE(offset) & 0x1fffffff;
    return { length: val, bytesRead: 4 };
  } else {
    const val = buf.readUInt32BE(offset + 1);
    return { length: val, bytesRead: 5 };
  }
}

/** Parse raw response buffer into an array of sentence arrays */
function parseResponse(data: Buffer): string[][] {
  const sentences: string[][] = [];
  let currentSentence: string[] = [];
  let offset = 0;

  while (offset < data.length) {
    const { length, bytesRead } = decodeLength(data, offset);
    offset += bytesRead;

    if (length === 0) {
      // End of sentence
      if (currentSentence.length > 0) {
        sentences.push(currentSentence);
        currentSentence = [];
      }
      continue;
    }

    if (offset + length > data.length) break;

    const word = data.subarray(offset, offset + length).toString('utf-8');
    offset += length;
    currentSentence.push(word);
  }

  if (currentSentence.length > 0) {
    sentences.push(currentSentence);
  }

  return sentences;
}

/** Convert sentence words into key-value objects */
function sentenceToObject(words: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const word of words) {
    if (word.startsWith('=')) {
      const eqIdx = word.indexOf('=', 1);
      if (eqIdx > 0) {
        const key = word.substring(1, eqIdx);
        const value = word.substring(eqIdx + 1);
        obj[key] = value;
      }
    } else if (word.startsWith('!')) {
      obj['_type'] = word;
    }
  }
  return obj;
}

/** Low-level: send a command and receive response */
async function sendCommand(
  command: string,
  params: Record<string, string> = {},
  query: string[] = []
): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let responseBuffer = Buffer.alloc(0);
    let isResolved = false;

    const timer = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        reject(new Error('MikroTik API timeout'));
      }
    }, MT_TIMEOUT);

    socket.connect(MT_PORT, MT_HOST, () => {
      // RouterOS 7.x: plaintext login (send name + password immediately)
      // RouterOS 6.x: challenge-response (send /login bare, get challenge)
      // We try plaintext first — works on both if password is set
      const loginCmd = Buffer.concat([
        encodeWord('/login'),
        encodeWord(`=name=${MT_USER}`),
        encodeWord(`=password=${MT_PASS}`),
        Buffer.from([0x00]),
      ]);
      socket.write(loginCmd);
    });

    let phase: 'login' | 'login_v6_auth' | 'command' | 'done' = 'login';

    socket.on('data', (chunk: Buffer) => {
      responseBuffer = Buffer.concat([responseBuffer, chunk]);

      // Try to parse accumulated data
      const sentences = parseResponse(responseBuffer);
      if (sentences.length === 0) return;

      if (phase === 'login') {
        const firstSentence = sentenceToObject(sentences[0]);

        if (firstSentence['_type'] === '!done' && firstSentence['ret']) {
          // RouterOS v6: returned challenge hash — need MD5 response
          const challenge = Buffer.from(firstSentence['ret'], 'hex');
          const hash = crypto.createHash('md5');
          hash.update(Buffer.from([0x00]));
          hash.update(Buffer.from(MT_PASS, 'utf-8'));
          hash.update(challenge);
          const response = hash.digest('hex');

          phase = 'login_v6_auth';
          responseBuffer = Buffer.alloc(0);

          const authCmd = Buffer.concat([
            encodeWord('/login'),
            encodeWord(`=name=${MT_USER}`),
            encodeWord(`=response=00${response}`),
            Buffer.from([0x00]),
          ]);
          socket.write(authCmd);
        } else if (firstSentence['_type'] === '!done' && !firstSentence['ret']) {
          // RouterOS v7: plaintext login succeeded
          phase = 'command';
          responseBuffer = Buffer.alloc(0);

          // Send the actual command
          const cmdParts: Buffer[] = [encodeWord(command)];
          for (const [key, value] of Object.entries(params)) {
            cmdParts.push(encodeWord(`=${key}=${value}`));
          }
          for (const q of query) {
            cmdParts.push(encodeWord(q));
          }
          cmdParts.push(Buffer.from([0x00]));
          socket.write(Buffer.concat(cmdParts));
        } else if (firstSentence['_type'] === '!trap') {
          clearTimeout(timer);
          isResolved = true;
          socket.destroy();
          reject(new Error(firstSentence['message'] || 'Login failed'));
        }
        return;
      }

      if (phase === 'login_v6_auth') {
        const authResult = sentenceToObject(sentences[0]);
        if (authResult['_type'] === '!done') {
          // v6 auth successful, send command
          phase = 'command';
          responseBuffer = Buffer.alloc(0);

          const cmdParts: Buffer[] = [encodeWord(command)];
          for (const [key, value] of Object.entries(params)) {
            cmdParts.push(encodeWord(`=${key}=${value}`));
          }
          for (const q of query) {
            cmdParts.push(encodeWord(q));
          }
          cmdParts.push(Buffer.from([0x00]));
          socket.write(Buffer.concat(cmdParts));
        } else if (authResult['_type'] === '!trap') {
          clearTimeout(timer);
          isResolved = true;
          socket.destroy();
          reject(new Error(authResult['message'] || 'Authentication failed'));
        }
        return;
      }

      if (phase === 'command') {
        // Check if we got the final !done
        const hasDone = sentences.some(s => s.includes('!done'));
        const hasTrap = sentences.some(s => s.includes('!trap'));

        if (hasDone || hasTrap) {
          clearTimeout(timer);
          isResolved = true;
          socket.destroy();

          if (hasTrap) {
            const trapSentence = sentences.find(s => s.includes('!trap'));
            const trapObj = trapSentence ? sentenceToObject(trapSentence) : {};
            reject(new Error(trapObj['message'] || 'Command failed'));
            return;
          }

          // Collect all !re sentences (data rows)
          const results: Record<string, string>[] = [];
          for (const sentence of sentences) {
            if (sentence.includes('!re')) {
              results.push(sentenceToObject(sentence));
            }
          }
          resolve(results);
        }
      }
    });

    socket.on('error', (err: Error) => {
      clearTimeout(timer);
      if (!isResolved) {
        isResolved = true;
        reject(new Error(`MikroTik connection error: ${err.message}`));
      }
    });

    socket.on('close', () => {
      clearTimeout(timer);
      if (!isResolved) {
        isResolved = true;
        reject(new Error('MikroTik connection closed unexpectedly'));
      }
    });
  });
}

// ============================================================
// PUBLIC API FUNCTIONS
// ============================================================

export interface PppoeActiveSession {
  id: string;
  name: string;
  service: string;
  callerId: string;
  address: string;
  uptime: string;
  encoding: string;
  sessionId: string;
  limitBytesIn?: string;
  limitBytesOut?: string;
}

export interface PppoeSecret {
  id: string;
  name: string;
  password: string;
  service: string;
  profile: string;
  disabled: boolean;
  comment: string;
  lastLoggedOut?: string;
}

export interface InterfaceTraffic {
  name: string;
  rxBitsPerSecond: number;
  txBitsPerSecond: number;
  rxBytesPerSecond: number;
  txBytesPerSecond: number;
}

/** Get all active PPPoE sessions */
export async function getActivePppoe(): Promise<PppoeActiveSession[]> {
  const rows = await sendCommand('/ppp/active/print');
  return rows.map(r => ({
    id: r['.id'] || '',
    name: r['name'] || '',
    service: r['service'] || '',
    callerId: r['caller-id'] || '',
    address: r['address'] || '',
    uptime: r['uptime'] || '',
    encoding: r['encoding'] || '',
    sessionId: r['session-id'] || '',
    limitBytesIn: r['limit-bytes-in'] || undefined,
    limitBytesOut: r['limit-bytes-out'] || undefined,
  }));
}

/** Get all PPPoE secrets */
export async function getPppoeSecrets(): Promise<PppoeSecret[]> {
  const rows = await sendCommand('/ppp/secret/print');
  return rows.map(r => ({
    id: r['.id'] || '',
    name: r['name'] || '',
    password: r['password'] || '',
    service: r['service'] || '',
    profile: r['profile'] || '',
    disabled: r['disabled'] === 'true',
    comment: r['comment'] || '',
    lastLoggedOut: r['last-logged-out'] || undefined,
  }));
}

/** Kick (disconnect) an active PPPoE session by ID */
export async function kickPppoeSession(sessionId: string): Promise<boolean> {
  await sendCommand('/ppp/active/remove', {}, [`=.id=${sessionId}`]);
  return true;
}

/** Change a PPPoE secret's profile (for isolir/unisolir) */
export async function changePppoeProfile(
  secretId: string,
  newProfile: string
): Promise<boolean> {
  await sendCommand('/ppp/secret/set', {
    '.id': secretId,
    'profile': newProfile,
  });
  return true;
}

/** Enable or disable a PPPoE secret */
export async function setPppoeDisabled(
  secretId: string,
  disabled: boolean
): Promise<boolean> {
  await sendCommand('/ppp/secret/set', {
    '.id': secretId,
    'disabled': disabled ? 'true' : 'false',
  });
  return true;
}

/** Get interface traffic stats (for bandwidth monitoring) */
export async function getInterfaceTraffic(interfaceName: string): Promise<InterfaceTraffic | null> {
  try {
    const rows = await sendCommand('/interface/monitor-traffic', {
      'interface': interfaceName,
      'once': '',
    });
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      name: interfaceName,
      rxBitsPerSecond: parseInt(r['rx-bits-per-second'] || '0', 10),
      txBitsPerSecond: parseInt(r['tx-bits-per-second'] || '0', 10),
      rxBytesPerSecond: parseInt(r['rx-bytes-per-second'] || '0', 10),
      txBytesPerSecond: parseInt(r['tx-bytes-per-second'] || '0', 10),
    };
  } catch {
    return null;
  }
}

/** Get router system resource info */
export async function getSystemResource(): Promise<Record<string, string> | null> {
  try {
    const rows = await sendCommand('/system/resource/print');
    return rows.length > 0 ? rows[0] : null;
  } catch {
    return null;
  }
}

/** Get all PPPoE profiles */
export async function getPppoeProfiles(): Promise<Record<string, string>[]> {
  try {
    return await sendCommand('/ppp/profile/print');
  } catch {
    return [];
  }
}

/** Test API connection (lightweight) */
export async function testConnection(): Promise<{ success: boolean; error?: string; version?: string }> {
  try {
    const resource = await getSystemResource();
    return {
      success: true,
      version: resource?.['version'] || 'unknown',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}
