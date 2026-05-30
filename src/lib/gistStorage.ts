import type { MonthRecord, Payment } from './types';

const GIST_ID = import.meta.env.PUBLIC_GIST_ID as string | undefined;
const GITHUB_PAT = import.meta.env.PUBLIC_GITHUB_PAT as string | undefined;
const SAVE_PIN = import.meta.env.PUBLIC_SAVE_PIN as string | undefined;
const GIST_FILE = 'records.json';

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

export async function saveToGist(
  data: GistData,
  pin: string,
): Promise<GistSaveResult> {
  if (!SAVE_PIN || pin !== SAVE_PIN) return 'wrong_pin';
  if (!GIST_ID || !GITHUB_PAT) return 'error';
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
