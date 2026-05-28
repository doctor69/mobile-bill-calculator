import { useState, useMemo, useEffect } from 'react';
import type { MonthRecord, PersonShare } from '../lib/types';
import { getPersonTotal } from '../lib/calculator';

interface Props {
  records: MonthRecord[];
}

const GROUP_ACCENT: Record<string, { bg: string; border: string; text: string; dot: string; bar: string }> = {
  dari:       { bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', bar: 'bg-emerald-400' },
  saket:      { bg: 'bg-blue-50',     border: 'border-blue-200',    text: 'text-blue-700',    dot: 'bg-blue-500',    bar: 'bg-blue-400'    },
  bajpayee:   { bg: 'bg-amber-50',    border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500',   bar: 'bg-amber-400'   },
  mainali:    { bg: 'bg-violet-50',   border: 'border-violet-200',  text: 'text-violet-700',  dot: 'bg-violet-500',  bar: 'bg-violet-400'  },
  saroj:      { bg: 'bg-red-50',      border: 'border-red-200',     text: 'text-red-700',     dot: 'bg-red-500',     bar: 'bg-red-400'     },
  chiranjiwi: { bg: 'bg-pink-50',     border: 'border-pink-200',    text: 'text-pink-700',    dot: 'bg-pink-500',    bar: 'bg-pink-400'    },
  newline:    { bg: 'bg-slate-50',    border: 'border-slate-200',   text: 'text-slate-700',   dot: 'bg-slate-500',   bar: 'bg-slate-400'   },
};

const EMOJI: Record<string, string> = {
  dari: '🟢', saket: '🔵', bajpayee: '🟡', mainali: '🟣', saroj: '🔴', chiranjiwi: '🩷', newline: '⚫',
};

function formatMonth(m: string) {
  return new Date(m + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function PersonCard({ person, maxAmount }: { person: PersonShare; maxAmount: number }) {
  const total = getPersonTotal(person);
  const pct = maxAmount > 0 ? (total / maxAmount) * 100 : 0;
  const g = GROUP_ACCENT[person.accountGroup] ?? GROUP_ACCENT.saket;

  return (
    <div className={`rounded-2xl border-2 ${g.bg} ${g.border} p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow`}>
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
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/70 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${g.bar}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

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
      {/* Month navigation bar */}
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

      {/* Bill summary stats */}
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

      {/* Person cards grid */}
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

      {/* Trend chart: sparkline of last 6 months per person */}
      <TrendSection records={sorted.slice(0, 6).reverse()} />
    </div>
  );
}

function TrendSection({ records }: { records: MonthRecord[] }) {
  if (records.length < 2) return null;

  // Collect unique groups across all records
  const groups = Array.from(
    new Set(records.flatMap((r) => r.personShares.map((p) => p.accountGroup)))
  );

  // Pick first record's personShares to get display names
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
