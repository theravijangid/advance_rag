import Logger from '../config/logger';

const BLOCKED_IP_PREFIXES = [
  '127.',
  '10.',
  '192.168.',
  '0.',
  '169.254.',
];

function isPrivate172(ip: string): boolean {
  const match = ip.match(/^172\.(\d+)\./);
  if (!match) return false;
  const second = parseInt(match[1], 10);
  return second >= 16 && second <= 31;
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  '0.0.0.0',
  '[::1]',
  '[::0]',
  '[0:0:0:0:0:0:0:0]',
  '[0:0:0:0:0:0:0:1]',
]);

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  url?: URL;
}

export function validateUrlForSsrf(rawUrl: string): UrlValidationResult {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, error: 'Malformed URL: unable to parse' };
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return {
      valid: false,
      error: `Unsupported protocol "${parsed.protocol}". Only http:// and https:// are allowed`,
    };
  }

  if (parsed.username || parsed.password) {
    return { valid: false, error: 'URLs with embedded credentials are not allowed' };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { valid: false, error: `Blocked hostname: "${hostname}"` };
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    for (const prefix of BLOCKED_IP_PREFIXES) {
      if (hostname.startsWith(prefix)) {
        return { valid: false, error: `Blocked private/internal IP address: "${hostname}"` };
      }
    }
    if (isPrivate172(hostname)) {
      return { valid: false, error: `Blocked private IP address: "${hostname}"` };
    }
  }

  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    const ipv6 = hostname.slice(1, -1).toLowerCase();
    if (ipv6 === '::1' || ipv6 === '::' || ipv6 === '::0' || ipv6.startsWith('fe80:') || ipv6.startsWith('fc') || ipv6.startsWith('fd')) {
      return { valid: false, error: `Blocked IPv6 address: "${hostname}"` };
    }
  }

  if (!hostname || hostname.length === 0) {
    return { valid: false, error: 'URL has no hostname' };
  }

  Logger.debug(`URL validated for SSRF safety: ${parsed.href}`);
  return { valid: true, url: parsed };
}
