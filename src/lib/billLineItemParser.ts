/**
 * In-browser T-Mobile bill line-item parser.
 *
 * Mirrors the logic in scripts/process_new_bill.py so that uploading a PDF
 * in the app produces the same per-phone breakdown as the Python pipeline —
 * no local scripts, no redeploy needed for new months.
 *
 * Exported surface:
 *   parseBillLineItems(text) → Record<group, { items, phone_sum }>
 */

import type { PersonShareLineItem } from './types';

// ── Phone → person mapping (keep in sync with scripts/process_new_bill.py) ──

const PHONE_MAP: Record<string, { label: string; group: string }> = {
  '208-840-1299': { label: 'Sanjay',          group: 'dari'       },
  '401-207-7052': { label: 'Saket',            group: 'saket'      },
  '401-338-8422': { label: 'Chiranjiwi',       group: 'chiranjiwi' },
  '617-955-9929': { label: 'Bikas',            group: 'bikas'      },
  '857-205-9815': { label: 'Ritesh',           group: 'ritesh'     },
  '857-264-9862': { label: 'Saroj',            group: 'mainali'    },
  '407-416-5178': { label: 'Manoj (Bajpayee)', group: 'bajpayee'   },
  '252-350-3063': { label: 'Sapana',           group: 'bajpayee'   },
  '701-412-4006': { label: 'Mahima',           group: 'dari'       },
  '701-415-5731': { label: 'Dari',             group: 'dari'       },
  '863-449-8681': { label: 'Home Internet',    group: 'saket'      },
  '863-606-2309': { label: 'Home Internet',    group: 'saket'      },
};

// ── Types ────────────────────────────────────────────────────────────────────

interface PhoneLine {
  plans: number;
  equipment: number;
  total: number;
  included_in_plan: boolean;
  equipment_detail: EquipDetail[];
}

interface EquipDetail {
  device: string;
  net: number;
  gross: number | null;
  promo_credit: number | null;
  promo_name: string | null;
  installment_num: number | null;
  installment_of: number | null;
}

export interface GroupLineData {
  items: PersonShareLineItem[];
  phone_sum: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseAmount(s: string): number {
  const cleaned = s.replace(/[$,]/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Bill summary parser ───────────────────────────────────────────────────────

function parseBillSummary(text: string): Record<string, PhoneLine> {
  const summaryIdx = text.indexOf('THIS BILL SUMMARY');
  if (summaryIdx === -1) return {};
  const summaryText = text.slice(summaryIdx, summaryIdx + 4000);

  const dollar = String.raw`-?\$[\d,]+\.\d{2}`;
  // Handles both 4-col (Plans/Equip/Svc/Total) and 5-col (+ One-time) formats
  const phoneRe = new RegExp(
    String.raw`\((\d{3})\)\s+(\d{3}-\d{4})\s+` +
    String.raw`(?:Voice|Mobile Internet|Data|New Voice)\s+` +
    `(Included|${dollar})\\s+` +
    `(${dollar}|-)\\s+` +
    `(${dollar}|-)\\s+` +
    `(?:(?:${dollar}|-)\\s+)?` +    // optional One-time charges column
    `(${dollar})`,
    'g',
  );

  const lines: Record<string, PhoneLine> = {};
  for (const m of summaryText.matchAll(phoneRe)) {
    const phone = `${m[1]}-${m[2]}`;
    const plansStr = m[3];
    const plans = plansStr === 'Included' ? 0 : parseAmount(plansStr);
    lines[phone] = {
      plans:            r2(plans),
      equipment:        r2(parseAmount(m[4])),
      total:            r2(parseAmount(m[6])),
      included_in_plan: plansStr === 'Included',
      equipment_detail: [],
    };
  }
  return lines;
}

// ── Equipment detail parser ───────────────────────────────────────────────────

function parseEquipmentDetail(text: string): Record<string, EquipDetail[]> {
  // Find HANDSETS section header (standalone line, not a digit-prefixed summary line)
  const hsMatch = text.match(/(?:^|\n)(HANDSETS)\s*\n/);
  let startIdx = hsMatch ? (text.indexOf(hsMatch[0])) : -1;
  if (startIdx === -1) {
    const detailedIdx = text.indexOf('DETAILED CHARGES');
    startIdx = text.indexOf('EQUIPMENT', detailedIdx !== -1 ? detailedIdx : 0);
  }
  if (startIdx === -1) return {};

  const equip = text.slice(startIdx, startIdx + 12000);
  const rows = equip.split('\n');

  const dollar = String.raw`-?\$[\d,]+\.\d{2}`;
  const installmentRe = /\$([\d,]+\.\d{2})\s+installment\s+with\s+\$([\d,]+\.\d{2})\s+([\w\s]+?)(?:\s*\((?:ID\d+)\))?$/;
  const instNumRe = /Installment\s+(\d+)\s+of\s+(\d+)/;
  const balanceRe = /Balance:\s+\$([\d,]+\.\d{2})/;
  const newPhoneRe = /^\(\d{3}\)\s+\d{3}-\d{4}\s+/;
  const lineRe = new RegExp(
    String.raw`\((\d{3})\)\s+(\d{3}-\d{4})\s+(.+)\s+(${dollar})`,
  );

  const result: Record<string, EquipDetail[]> = {};

  for (let i = 0; i < rows.length; i++) {
    const m = rows[i].trim().match(lineRe);
    if (!m) continue;
    // Skip bill-summary-style rows (device name is "Voice", "Included", etc.)
    if (/^(?:Voice|Mobile Internet|Data|Included)\b/.test(m[3].trim())) continue;

    const phone = `${m[1]}-${m[2]}`;
    const net = parseAmount(m[4]);
    let gross: number | null = null;
    let promo: number | null = null;
    let promoName: string | null = null;
    let instNum: number | null = null;
    let instOf: number | null = null;

    for (let j = i + 1; j < Math.min(i + 8, rows.length); j++) {
      const nxt = rows[j].trim();
      if (newPhoneRe.test(nxt) && j > i + 1) break;

      const im = nxt.match(installmentRe);
      if (im) {
        gross = parseAmount(im[1]);
        promo = parseAmount(im[2]);
        promoName = im[3].trim();
      }
      const nm = nxt.match(instNumRe);
      if (nm) { instNum = parseInt(nm[1]); instOf = parseInt(nm[2]); }
    }

    (result[phone] ??= []).push({
      device:          m[3].trim().slice(0, 50),
      net:             r2(net),
      gross:           gross !== null ? r2(gross) : null,
      promo_credit:    promo !== null ? r2(promo) : null,
      promo_name:      promoName,
      installment_num: instNum,
      installment_of:  instOf,
    });
  }
  return result;
}

// ── LineItems generator ───────────────────────────────────────────────────────

function makeEquipSublabel(eq: EquipDetail): string | undefined {
  const parts: string[] = [];
  if (eq.installment_num && eq.installment_of)
    parts.push(`installment ${eq.installment_num}/${eq.installment_of}`);
  if (eq.gross && eq.promo_credit && eq.promo_credit > 0)
    parts.push(`$${eq.gross.toFixed(2)} − $${eq.promo_credit.toFixed(2)} promo = $${(eq.gross - eq.promo_credit).toFixed(2)}`);
  else if (eq.gross)
    parts.push(`$${eq.gross.toFixed(2)}/mo`);
  return parts.length ? parts.join(', ') : undefined;
}

/**
 * Parse a T-Mobile bill text and return per-group line items.
 *
 * The `phone_sum` in each group is the sum of phone-level charges (plan + EIP).
 * The "Base plan share" account portion is computed at call-site from
 * (share.lineCharges + share.sharedCostShare) - phone_sum, matching lineItemsData.ts.
 *
 * Returns an empty record if the bill format isn't recognised.
 */
export function parseBillLineItems(text: string): Record<string, GroupLineData> {
  const phoneLines = parseBillSummary(text);
  if (Object.keys(phoneLines).length === 0) return {};

  const equipDetail = parseEquipmentDetail(text);

  // Attach equipment_detail to each phone line
  for (const [phone, details] of Object.entries(equipDetail)) {
    if (phoneLines[phone]) phoneLines[phone].equipment_detail = details;
  }

  // Build per-group line items
  const byGroup: Record<string, GroupLineData> = {};

  for (const [phone, line] of Object.entries(phoneLines)) {
    const info = PHONE_MAP[phone];
    if (!info) continue;  // unknown phone — skip

    const { label, group } = info;
    if (!byGroup[group]) byGroup[group] = { items: [], phone_sum: 0 };

    byGroup[group].phone_sum = r2(byGroup[group].phone_sum + line.total);

    // Standalone plan cost (lines that aren't included in the account plan)
    if (line.plans > 0 && !line.included_in_plan) {
      byGroup[group].items.push({ label: `${label} — plan`, amount: r2(line.plans), kind: 'plan' });
    }

    // Equipment installments
    if (line.equipment > 0) {
      const devItems = line.equipment_detail.filter(e => e.installment_num !== null);
      if (devItems.length > 0) {
        for (const eq of devItems) {
          const item: PersonShareLineItem = {
            label: `${label} — ${eq.device}`,
            amount: r2(eq.net),
            kind:   'equipment',
          };
          const sublabel = makeEquipSublabel(eq);
          if (sublabel) item.sublabel = sublabel;
          byGroup[group].items.push(item);
        }
      } else {
        byGroup[group].items.push({ label: `${label} — device installment`, amount: r2(line.equipment), kind: 'equipment' });
      }
    } else if (line.equipment < 0) {
      byGroup[group].items.push({ label: `${label} — promo credit`, amount: r2(Math.abs(line.equipment)), kind: 'promo_credit' });
    }
  }

  return byGroup;
}
