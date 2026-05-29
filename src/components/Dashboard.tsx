import { useState, useMemo, useEffect } from 'react';
import type { MonthRecord, PersonShare, PersonShareLineItem } from '../lib/types';
import { getPersonTotal } from '../lib/calculator';
import { TOTAL_PAID } from '../lib/paymentsData';

interface Props {
  records: MonthRecord[];
}

const GROUP_ACCENT: Record<string, { bg: string; border: string; text: string; dot: string; bar: string; balanceBg: string }> = {
  dari:       { bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', bar: 'bg-emerald-400', balanceBg: 'bg-emerald-500' },
  saket:      { bg: 'bg-blue-50',     border: 'border-blue-200',    text: 'text-blue-700',    dot: 'bg-blue-500',    bar: 'bg-blue-400',    balanceBg: 'bg-blue-500'    },
  bajpayee:   { bg: 'bg-amber-50',    border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500',   bar: 'bg-amber-400',   balanceBg: 'bg-amber-500'   },
  mainali:    { bg: 'bg-violet-50',   border: 'border-violet-200',  text: 'text-violet-700',  dot: 'bg-violet-500',  bar: 'bg-violet-400',  balanceBg: 'bg-violet-500'  },
  bikas:      { bg: 'bg-cyan-50',     border: 'border-cyan-200',    text: 'text-cyan-700',    dot: 'bg-cyan-500',    bar: 'bg-cyan-400',    balanceBg: 'bg-cyan-500'    },
  ritesh:     { bg: 'bg-red-50',      border: 'border-red-200',     text: 'text-red-700',     dot: 'bg-red-500',     bar: 'bg-red-400',     balanceBg: 'bg-red-500'     },
  saroj:      { bg: 'bg-violet-50',   border: 'border-violet-200',  text: 'text-violet-700',  dot: 'bg-violet-500',  bar: 'bg-violet-400',  balanceBg: 'bg-violet-500'  },
  chiranjiwi: { bg: 'bg-pink-50',     border: 'border-pink-200',    text: 'text-pink-700',    dot: 'bg-pink-500',    bar: 'bg-pink-400',    balanceBg: 'bg-pink-500'    },
  newline:    { bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', bar: 'bg-emerald-400', balanceBg: 'bg-emerald-500' },
};

const EMOJI: Record<string, string> = {
  dari: '🟢', saket: '🔵', bajpayee: '🟡', mainali: '🟣', bikas: '🩵',
  ritesh: '🔴', saroj: '🟣', chiranjiwi: '🩷', newline: '🟢',
};

function formatMonth(m: string) {
  return new Date(m + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const LINE_ITEM_COLORS: Record<PersonShareLineItem['kind'], string> = {
  plan:          'text-blue-600',
  equipment:     'text-indigo-600',
  shared:        'text-gray-600',
  credit:        'text-green-600',
  promo_credit:  'text-emerald-600',
  tax:           'text-gray-400',
};

const LINE_ITEM_PREFIX: Record<PersonShareLineItem['kind'], string> = {
  plan:          '+',
  equipment:     '+',
  shared:        '+',
  credit:        '−',
  promo_credit:  '−',
  tax:           '+',
};

function LineItemRow({ item }: { item: PersonShareLineItem }) {
  const color = LINE_ITEM_COLORS[item.kind] ?? 'text-gray-600';
  const prefix = LINE_ITEM_PREFIX[item.kind] ?? '+';
  const isCredit = item.kind === 'credit' || item.kind === 'promo_credit';
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <div className="flex-1 min-w-0">
        <div className="text-gray-600 truncate">{item.label}</div>
        {item.sublabel && (
          <div className="text-[10px] text-gray-400 leading-tight mt-0.5 break-words">{item.sublabel}</div>
        )}
      </div>
      <span className={`font-mono flex-shrink-0 ${color}`}>
        {prefix}${Math.abs(item.amount).toFixed(2)}
      </span>
    </div>
  );
}

function PersonCard({ person, maxAmount }: { person: PersonShare; maxAmount: number }) {
  const total = getPersonTotal(person);
  const pct = maxAmount > 0 ? (total / maxAmount) * 100 : 0;
  const g = GROUP_ACCENT[person.accountGroup] ?? GROUP_ACCENT.saket;
  const [expanded, setExpanded] = useState(false);

  const hasBreakdown = person.lineCharges > 0 || person.sharedCostShare > 0 || person.credits !== 0;

  return (
    <div
      className={`rounded-2xl border-2 ${g.bg} ${g.border} p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow ${hasBreakdown ? 'cursor-pointer select-none' : ''}`}
      onClick={() => hasBreakdown && setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${g.dot}`} />
          <div>
            <div className={`font-semibold text-sm ${g.text}`}>{person.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {person.lines.join(' + ')}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 leading-none">
            ${total.toFixed(2)}
          </div>
          {hasBreakdown && (
            <div className="text-[10px] text-gray-400 mt-0.5">{expanded ? 'tap to collapse' : 'tap for details'}</div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/70 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${g.bar}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      {/* Breakdown */}
      {expanded && (
        <div className="border-t border-black/10 pt-3 space-y-1.5">
          {person.manualOverride !== undefined ? (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Manual Override</span>
              <span className="font-mono font-semibold text-orange-600">${person.manualOverride.toFixed(2)}</span>
            </div>
          ) : (
            <>
              {/* Per-line itemized breakdown if available */}
              {person.lineItems && person.lineItems.length > 0 ? (
                <div className="space-y-1">
                  {person.lineItems.map((item, idx) => (
                    <LineItemRow key={idx} item={item} />
                  ))}
                  <div className="flex justify-between text-xs text-gray-400 pt-1 border-t border-black/5">
                    <span>Subtotal</span>
                    <span className="font-mono">${(person.lineCharges + person.sharedCostShare).toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Line Charges</span>
                    <span className="font-mono text-gray-700">+${person.lineCharges.toFixed(2)}</span>
                  </div>
                  {person.sharedCostShare > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Shared Costs</span>
                      <span className="font-mono text-gray-700">+${person.sharedCostShare.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
              {person.credits > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Credits Applied</span>
                  <span className="font-mono text-green-600">−${person.credits.toFixed(2)}</span>
                </div>
              )}
              {person.credits < 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Billing Adj. (Sapana)</span>
                  <span className="font-mono text-amber-600">+${Math.abs(person.credits).toFixed(2)}</span>
                </div>
              )}
              {person.previousDue !== 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Carried Balance</span>
                  <span className={`font-mono ${person.previousDue > 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {person.previousDue > 0 ? '+' : '−'}${Math.abs(person.previousDue).toFixed(2)}
                  </span>
                </div>
              )}
            </>
          )}
          <div className="flex justify-between text-xs pt-1.5 border-t border-black/10 font-semibold">
            <span className="text-gray-700">Total This Month</span>
            <span className="text-gray-900">${total.toFixed(2)}</span>
          </div>
          {person.paid > 0 && (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Paid</span>
                <span className="font-mono text-green-600">−${person.paid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-700">Remaining</span>
                <span className={`${(total - person.paid) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                  ${Math.max(0, total - person.paid).toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Notes */}
      {person.notes && (
        <div className="flex items-start gap-1.5 bg-white/60 rounded-lg px-2.5 py-1.5">
          <span className="text-amber-500 text-xs mt-0.5">⚠</span>
          <span className="text-xs text-gray-600 leading-relaxed">{person.notes}</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ records }: Props) {
  const sorted = useMemo(
    () => [...records].sort((a, b) => b.month.localeCompare(a.month)),
    [records]
  );

  const [selectedMonth, setSelectedMonth] = useState<string>(() => sorted[0]?.month ?? '');

  // When records first load (from useEffect in App), default to most recent month
  useEffect(() => {
    if (!selectedMonth && sorted.length > 0) {
      setSelectedMonth(sorted[0].month);
    }
  }, [sorted, selectedMonth]);

  const currentIdx = sorted.findIndex((r) => r.month === selectedMonth);
  const record = sorted[currentIdx] ?? null;

  function navigate(dir: -1 | 1) {
    const next = sorted[currentIdx + dir];
    if (next) setSelectedMonth(next.month);
  }

  if (!record) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-5xl mb-4">📱</div>
        <p className="text-lg font-medium">No bill history yet</p>
        <p className="text-sm mt-1">Upload a T-Mobile PDF to get started</p>
      </div>
    );
  }

  const allTotals = record.personShares.map(getPersonTotal);
  const grandTotal = allTotals.reduce((s, v) => s + v, 0);
  const maxAmount = Math.max(...allTotals, 1);
  const diff = Math.abs(grandTotal - record.totalBill);
  const isVerified = diff < 0.05;

  return (
    <div className="space-y-6">
      {/* ── BALANCE OVERVIEW (Left to Pay) ── */}
      <BalanceSection records={sorted} />

      {/* ── MONTH NAVIGATION ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(1)}
            disabled={currentIdx >= sorted.length - 1}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ‹
          </button>

          <div className="flex-1 text-center">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xl font-bold text-gray-800 bg-transparent border-none outline-none cursor-pointer text-center appearance-none hover:text-[#e20074] transition-colors"
            >
              {sorted.map((r) => (
                <option key={r.month} value={r.month}>
                  {formatMonth(r.month)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => navigate(-1)}
            disabled={currentIdx <= 0}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      {/* ── BILL SUMMARY STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Total Bill</div>
          <div className="text-2xl font-bold text-gray-900">${record.totalBill.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Calculated</div>
          <div className={`text-2xl font-bold ${isVerified ? 'text-green-600' : 'text-red-500'}`}>
            ${grandTotal.toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Status</div>
          <div className={`text-sm font-semibold mt-1 ${isVerified ? 'text-green-600' : 'text-amber-500'}`}>
            {isVerified ? '✓ Verified' : `⚠ Off $${diff.toFixed(2)}`}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Paid By</div>
          <div className="text-sm font-semibold text-gray-700 mt-1">
            {record.paidBy ? `${record.paidBy} 💳` : '—'}
          </div>
        </div>
      </div>

      {/* Notes banner */}
      {record.notes && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <span className="text-amber-500 text-lg mt-0.5">ℹ</span>
          <p className="text-sm text-amber-800 leading-relaxed">{record.notes}</p>
        </div>
      )}

      {/* ── THIS MONTH'S BREAKDOWN ── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Who Owes What — {formatMonth(record.month)}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {record.personShares.map((p, i) => (
            <PersonCard key={i} person={p} maxAmount={maxAmount} />
          ))}
        </div>
      </div>

      {/* ── TREND CHART ── */}
      <TrendSection records={sorted.slice(0, 6).reverse()} />

      {/* ── ALL-TIME CUMULATIVE ── */}
      <CumulativeSection records={sorted} />
    </div>
  );
}

// ── Balance / Left-to-Pay Section ────────────────────────────────────────────

interface BalanceData {
  accountGroup: string;
  name: string;
  monthsSaket: number;   // months where Saket paid T-Mobile
  monthsSanjay: number;  // months where Sanjay paid T-Mobile
  owedSaket: number;     // charges in Saket-paid months (excl. saket group itself)
  owedSanjay: number;    // charges in Sanjay-paid months (excl. dari group itself)
  paid: number;          // total paid to Saket (from Excel)
  balSaket: number;      // still owed to Saket
  balSanjay: number;     // still owed to Sanjay
}

function BalanceSection({ records }: { records: MonthRecord[] }) {
  // Bucket every group's charges by who paid T-Mobile that month
  const bySaket  = new Map<string, { name: string; total: number; months: number }>();
  const bySanjay = new Map<string, { name: string; total: number; months: number }>();

  for (const record of records) {
    const isSanjay = record.paidBy === 'Sanjay';
    const target = isSanjay ? bySanjay : bySaket;
    for (const ps of record.personShares) {
      const amt = getPersonTotal(ps);
      const g   = ps.accountGroup;
      const ex  = target.get(g);
      if (ex) { ex.total += amt; ex.months += 1; }
      else      target.set(g, { name: ps.name, total: amt, months: 1 });
    }
  }

  const allGroups = new Set([...bySaket.keys(), ...bySanjay.keys()]);
  if (allGroups.size === 0) return null;

  const rows: BalanceData[] = Array.from(allGroups).map((group) => {
    const sd = bySaket.get(group);
    const jd = bySanjay.get(group);
    const paid = TOTAL_PAID[group] ?? 0;

    // Saket doesn't owe himself; Dari/Sanjay doesn't owe Sanjay
    const owedSaket  = group === 'saket' ? 0 : (sd?.total ?? 0);
    const owedSanjay = group === 'dari'  ? 0 : (jd?.total ?? 0);

    // Payments made (all to Saket historically); any overpayment offsets Sanjay balance
    const balSaket   = Math.max(0, owedSaket - paid);
    const overpay    = Math.max(0, paid - owedSaket);
    const balSanjay  = Math.max(0, owedSanjay - overpay);

    return {
      accountGroup: group,
      name: sd?.name ?? jd?.name ?? group,
      monthsSaket:  sd?.months ?? 0,
      monthsSanjay: jd?.months ?? 0,
      owedSaket,
      owedSanjay,
      paid,
      balSaket,
      balSanjay,
    };
  }).sort((a, b) => (b.balSaket + b.balSanjay) - (a.balSaket + a.balSanjay));

  // Aggregate totals
  const totalReceivableSaket  = rows.reduce((s, r) => s + r.balSaket,  0);
  const totalReceivableSanjay = rows.reduce((s, r) => s + r.balSanjay, 0);
  const totalOwedAll          = rows.reduce((s, r) => s + r.owedSaket + r.owedSanjay, 0);
  const totalPaidAll          = rows.reduce((s, r) => s + r.paid, 0);

  return (
    <div className="space-y-4">

      {/* ── TOP SUMMARY STRIP ── */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-2xl px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white font-bold text-base">💰 Balance Overview</h3>
            <p className="text-gray-400 text-xs mt-0.5">Split by who paid T-Mobile · pre-Jul 2025 vs Jul 2025+</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-white">
              ${(totalReceivableSaket + totalReceivableSanjay).toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">total outstanding</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-xs text-gray-400">All-time Owed</div>
            <div className="text-sm font-bold text-white">${totalOwedAll.toFixed(0)}</div>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-xs text-gray-400">Paid (Excel)</div>
            <div className="text-sm font-bold text-green-400">${totalPaidAll.toFixed(0)}</div>
          </div>
          <div className="bg-blue-500/20 rounded-xl px-3 py-2 text-center border border-blue-500/30">
            <div className="text-xs text-blue-300">→ Saket</div>
            <div className="text-sm font-bold text-white">${totalReceivableSaket.toFixed(0)}</div>
          </div>
          <div className="bg-emerald-500/20 rounded-xl px-3 py-2 text-center border border-emerald-500/30">
            <div className="text-xs text-emerald-300">→ Sanjay</div>
            <div className="text-sm font-bold text-white">${totalReceivableSanjay.toFixed(0)}</div>
          </div>
        </div>
      </div>

      {/* ── PER-GROUP ROWS ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <span>Group</span>
          <span className="text-right text-blue-500">← Saket (pre Jul'25)</span>
          <span className="text-right text-emerald-600">← Sanjay (Jul'25+)</span>
        </div>

        <div className="divide-y divide-gray-50">
          {rows.map((row) => {
            const g = GROUP_ACCENT[row.accountGroup] ?? GROUP_ACCENT.saket;
            const isSaketSettled  = row.balSaket  < 0.01;
            const isSanjaySettled = row.balSanjay < 0.01;
            const saketPaidPct  = row.owedSaket  > 0 ? Math.min(100, (row.paid / row.owedSaket) * 100) : 100;
            const sanjayPaidPct = row.owedSanjay > 0 ? 0 : 100; // no Sanjay payments tracked yet

            return (
              <div key={row.accountGroup} className="px-5 py-4">
                {/* Name + totals row */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 ${g.dot}`} />
                    <div>
                      <div className={`text-sm font-semibold ${g.text}`}>{row.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {row.monthsSaket > 0 && <span>{row.monthsSaket} mo w/ Saket</span>}
                        {row.monthsSaket > 0 && row.monthsSanjay > 0 && <span className="mx-1">·</span>}
                        {row.monthsSanjay > 0 && <span>{row.monthsSanjay} mo w/ Sanjay</span>}
                      </div>
                    </div>
                  </div>

                  {/* Saket balance */}
                  <div className="text-right min-w-[90px]">
                    {row.accountGroup === 'saket' ? (
                      <span className="text-xs text-gray-300 italic">payer</span>
                    ) : isSaketSettled ? (
                      <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">✓</span>
                    ) : (
                      <div>
                        <div className="text-sm font-black text-blue-700">${row.balSaket.toFixed(2)}</div>
                        <div className="text-xs text-gray-400">of ${row.owedSaket.toFixed(0)} owed</div>
                      </div>
                    )}
                  </div>

                  {/* Sanjay balance */}
                  <div className="text-right min-w-[90px]">
                    {row.accountGroup === 'dari' ? (
                      <span className="text-xs text-gray-300 italic">payer</span>
                    ) : isSanjaySettled && row.owedSanjay < 0.01 ? (
                      <span className="text-xs text-gray-300">—</span>
                    ) : isSanjaySettled ? (
                      <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">✓</span>
                    ) : (
                      <div>
                        <div className="text-sm font-black text-emerald-700">${row.balSanjay.toFixed(2)}</div>
                        <div className="text-xs text-gray-400">of ${row.owedSanjay.toFixed(0)} owed</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bars */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {/* Saket bar */}
                  {row.accountGroup !== 'saket' && row.owedSaket > 0 && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">
                        Paid ${Math.min(row.paid, row.owedSaket).toFixed(0)} / ${row.owedSaket.toFixed(0)}
                        <span className="ml-1 text-gray-300">({saketPaidPct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden flex">
                        <div className="h-full bg-green-400 rounded-l-full" style={{ width: `${saketPaidPct}%` }} />
                        {saketPaidPct < 100 && (
                          <div className="h-full bg-blue-300" style={{ width: `${100 - saketPaidPct}%` }} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sanjay bar */}
                  {row.accountGroup !== 'dari' && row.owedSanjay > 0 && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">
                        No payments tracked yet
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-emerald-300" style={{ width: `100%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Paid amounts from <span className="font-medium text-gray-600">T-Mobile.xlsx</span> "Paid" rows (all counted toward Saket's period).
            Sanjay period: Jul 2025 – present, no separate payments tracked yet.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Cumulative Section ────────────────────────────────────────────────────────

interface CumulativeRow {
  accountGroup: string;
  name: string;
  months: number;
  total: number;
  firstMonth: string;
  lastMonth: string;
}

function CumulativeSection({ records }: { records: MonthRecord[] }) {
  const byGroup = new Map<string, CumulativeRow>();

  for (const record of records) {
    for (const ps of record.personShares) {
      const amount = getPersonTotal(ps);
      const existing = byGroup.get(ps.accountGroup);
      if (existing) {
        existing.total += amount;
        existing.months += 1;
        if (record.month < existing.firstMonth) existing.firstMonth = record.month;
        if (record.month > existing.lastMonth) existing.lastMonth = record.month;
      } else {
        byGroup.set(ps.accountGroup, {
          accountGroup: ps.accountGroup,
          name: ps.name,
          months: 1,
          total: amount,
          firstMonth: record.month,
          lastMonth: record.month,
        });
      }
    }
  }

  if (byGroup.size === 0) return null;

  const rows = Array.from(byGroup.values()).sort((a, b) => b.total - a.total);
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          All-Time Cumulative Totals
        </h3>
        <span className="text-xs text-gray-400">
          {records.length} months •{' '}
          {formatMonth(records[records.length - 1]?.month ?? '')} – {formatMonth(records[0]?.month ?? '')}
        </span>
      </div>

      <div className="space-y-2">
        {rows.map((row) => {
          const g = GROUP_ACCENT[row.accountGroup] ?? GROUP_ACCENT.saket;
          const pct = grandTotal > 0 ? (row.total / grandTotal) * 100 : 0;
          const avgPerMonth = row.months > 0 ? row.total / row.months : 0;

          return (
            <div key={row.accountGroup} className={`rounded-xl border ${g.border} ${g.bg} px-4 py-3`}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${g.dot}`} />
                  <span className={`text-sm font-semibold ${g.text}`}>{row.name}</span>
                  <span className="text-xs text-gray-400">{row.months} mo</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-gray-900">${row.total.toFixed(2)}</span>
                  <span className="text-xs text-gray-400 ml-2">~${avgPerMonth.toFixed(0)}/mo</span>
                </div>
              </div>
              <div className="w-full bg-white/70 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${g.bar}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-600">Grand Total</span>
        <span className="text-lg font-bold text-gray-900">${grandTotal.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ── Trend Section ─────────────────────────────────────────────────────────────

function TrendSection({ records }: { records: MonthRecord[] }) {
  if (records.length < 2) return null;

  const groups = Array.from(
    new Set(records.flatMap((r) => r.personShares.map((p) => p.accountGroup)))
  );

  const nameMap: Record<string, string> = {};
  records.forEach((r) =>
    r.personShares.forEach((p) => { nameMap[p.accountGroup] = p.name; })
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Last {records.length} Months Trend</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-xs text-gray-400 font-medium pb-2 pr-4 whitespace-nowrap">Person</th>
              {records.map((r) => (
                <th key={r.month} className="text-center text-xs text-gray-400 font-medium pb-2 px-2 whitespace-nowrap">
                  {new Date(r.month + '-02').toLocaleDateString('en-US', { month: 'short' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {groups.map((group) => {
              const g = GROUP_ACCENT[group] ?? GROUP_ACCENT.saket;
              return (
                <tr key={group}>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className={`w-2 h-2 rounded-full ${g.dot}`} />
                      <span className={`text-xs font-medium ${g.text}`}>{nameMap[group] ?? group}</span>
                    </div>
                  </td>
                  {records.map((r) => {
                    const ps = r.personShares.find((p) => p.accountGroup === group);
                    const total = ps ? getPersonTotal(ps) : null;
                    return (
                      <td key={r.month} className="text-center py-2 px-2">
                        {total !== null ? (
                          <span className="text-xs font-mono text-gray-700">${total.toFixed(0)}</span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200">
              <td className="py-2 pr-4 text-xs font-semibold text-gray-500">Total</td>
              {records.map((r) => {
                const tot = r.personShares.reduce((s, p) => s + getPersonTotal(p), 0);
                return (
                  <td key={r.month} className="text-center py-2 px-2 text-xs font-bold text-gray-800">
                    ${tot.toFixed(0)}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
