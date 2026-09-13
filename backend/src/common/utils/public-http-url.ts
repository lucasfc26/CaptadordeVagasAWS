import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal']);

function isPrivateIp(ip: string): boolean {
  if (ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) {
    return true;
  }
  const ipv4 = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  const parts = ipv4.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

export async function assertPublicHttpUrl(raw: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('Informe uma URL de API válida');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('A API precisa usar http:// ou https://');
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    throw new Error('URL de API não permitida');
  }

  const addresses = isIP(hostname) ? [hostname] : (await lookup(hostname, { all: true })).map((entry) => entry.address);
  if (addresses.length === 0 || addresses.some(isPrivateIp)) {
    throw new Error('URL de API não permitida');
  }

  return parsed;
}
