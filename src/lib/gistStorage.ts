import type { MonthRecord, Payment } from './types';

const GIST_ID = import.meta.env.PUBLIC_GIST_ID as string | undefined;
const GITHUB_PAT = import.meta.env.PUBLIC_GITHUB_PAT as string | undefined;
const SAVE_PIN = import.meta.env.PUBLIC_SAVE_PIN as string | undefined;
const GIST_FILE = 'records.json';

// Per-group PINs: set GROUP_PINS secret as JSON, e.g. {"bajpayee":"1234","mainali":"5678"}
// A group PIN only authorizes saving that group's own payment.
// The master SAVE_PIN authorizes everything (records, migrate, any payment).
const GROUP_PINS: Record<string, string> = (() => {
  try {
    const raw = import.meta.env.PUBLIC_GROUP_PINS as string | undefined;
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch { return {}; }
})();

export interface GistData {
  records: MonthRecord[];
  payments: Payment[];
}

function parseGistContent(content: string): GistData {
  const parsed = JSON.parse(content);
  // Backward compat: old format was a plain MonthRecord array
  if (Array.isArray(parsed)) return { records: parsed, payments: [] };
  return { records: parsed.records ?? [], payments: parsed.payments ?? [] };
}

export function isGistEnabled(): boolean {
  return !!(GIST_ID && GITHUB_PAT && SAVE_PIN);
}

export function isMasterPin(pin: string): boolean {
  return !!(SAVE_PIN && pin === SAVE_PIN);
}

/** True if pin authorizes recording a payment for fromGroup (group PIN or master PIN). */
export function isValidPaymentPin(fromGroup: string, pin: string): boolean {
  if (isMasterPin(pin)) return true;
  const groupPin = GROUP_PINS[fromGroup];
  return !!(groupPin && pin === groupPin);
}

/** True if this group has a configured group PIN (used to tailor the hint text). */
export function hasGroupPin(group: string): boolean {
  return !!(GROUP_PINS[group]);
}

export async function loadFromGist(): Promise<GistData> {
  if (!GIST_ID) return { records: [], payments: [] };
  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return { records: [], payments: [] };
    const data = await res.json();
    const content = data.files?.[GIST_FILE]?.content;
    return content ? parseGistContent(content) : { records: [], payments: [] };
  } catch {
    return { records: [], payments: [] };
  }
}

export type GistSaveResult = 'ok' | 'wrong_pin' | 'error';

async function patchGist(data: GistData): Promise<GistSaveResult> {
  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${GITHUB_PAT}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
      },
      body: JSON.stringify({
        files: { [GIST_FILE]: { content: JSON.stringify(data, null, 2) } },
      }),
    });
    return res.ok ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}

/** Save records + payments — requires master PIN only. */
export async function saveToGist(data: GistData, pin: string): Promise<GistSaveResult> {
  if (!isMasterPin(pin)) return 'wrong_pin';
  if (!GIST_ID || !GITHUB_PAT) return 'error';
  return patchGist(data);
}

/** Save a payment — accepts group PIN (own group only) or master PIN. */
export async function savePaymentToGist(
  data: GistData,
  fromGroup: string,
  pin: string,
): Promise<GistSaveResult> {
  if (!isValidPaymentPin(fromGroup, pin)) return 'wrong_pin';
  if (!GIST_ID || !GITHUB_PAT) return 'error';
  return patchGist(data);
}
