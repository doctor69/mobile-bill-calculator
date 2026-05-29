/**
 * Generates enriched MonthRecord[] from historyData.ts and pushes to GitHub Gist.
 *
 * Usage:
 *   GIST_ID=<id> GITHUB_PAT=<token> npx tsx scripts/push_to_gist.ts
 *
 * Or with SAVE_PIN verification (matches app behaviour):
 *   GIST_ID=<id> GITHUB_PAT=<token> SAVE_PIN=<pin> npx tsx scripts/push_to_gist.ts
 *
 * Dry-run (prints JSON, no network call):
 *   DRY_RUN=1 npx tsx scripts/push_to_gist.ts
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ── Import source data ──────────────────────────────────────────────────────

// Use require so tsx resolves the path relative to the project root
const { HISTORY } = await import('../src/lib/historyData.js');
const { DEFAULT_CONFIG } = await import('../src/lib/config.js');
const { enrichPersonShares } = await import('../src/lib/lineItemsData.js');

import type { PersonShare, MonthRecord } from '../src/lib/types.js';

// ── Credit-adjustment logic (mirrors App.tsx applyCreditAdjustments) ────────

function applyCreditAdjustments(month: string, shares: PersonShare[]): PersonShare[] {
  const { creditConfigs } = DEFAULT_CONFIG;
  const active: Record<string, number> = {};
  for (const c of creditConfigs) {
    if (month < c.startDate || month > c.endDate) continue;
    active[c.accountGroup] = (active[c.accountGroup] ?? 0) + c.monthlyCredit;
  }
  return shares.map((share) => {
    const net = active[share.accountGroup];
    if (net === undefined) return share;
    const r = (n: number) => Math.round(n * 100) / 100;
    return {
      ...share,
      credits: r(share.credits + net),
      total:   r(share.total   - net),
      balance: r(share.balance - net),
    };
  });
}

// ── Enrich all HISTORY records ──────────────────────────────────────────────

const records: MonthRecord[] = HISTORY.map((r) => ({
  ...r,
  personShares: applyCreditAdjustments(
    r.month,
    enrichPersonShares(r.month, r.personShares),
  ),
})).sort((a, b) => b.month.localeCompare(a.month));

console.log(`✓ Enriched ${records.length} months (${records[records.length - 1].month} – ${records[0].month})`);

// ── Dry-run: write to file and exit ────────────────────────────────────────

const DRY_RUN = process.env.DRY_RUN === '1';
const outPath = path.join(__dirname, 'records_preview.json');
if (DRY_RUN) {
  fs.writeFileSync(outPath, JSON.stringify(records, null, 2));
  console.log(`Dry-run: wrote ${records.length} records → ${outPath}`);
  process.exit(0);
}

// ── Push to Gist ────────────────────────────────────────────────────────────

const GIST_ID = process.env.GIST_ID;
const GITHUB_PAT = process.env.GITHUB_PAT;

if (!GIST_ID || !GITHUB_PAT) {
  console.error('Error: set GIST_ID and GITHUB_PAT environment variables.');
  console.error('  GIST_ID=<id> GITHUB_PAT=<token> npx tsx scripts/push_to_gist.ts');
  process.exit(1);
}

console.log(`Pushing to Gist ${GIST_ID} …`);

const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${GITHUB_PAT}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github+json',
  },
  body: JSON.stringify({
    files: {
      'records.json': { content: JSON.stringify(records, null, 2) },
    },
  }),
});

if (res.ok) {
  console.log(`✓ Gist updated — ${records.length} records written.`);
} else {
  const body = await res.text();
  console.error(`✗ Gist update failed: ${res.status} ${res.statusText}`);
  console.error(body);
  process.exit(1);
}
