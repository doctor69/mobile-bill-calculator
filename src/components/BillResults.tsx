import { useState } from 'react';
import type { PersonShare } from '../lib/types';
import { getPersonTotal } from '../lib/calculator';
import { DEFAULT_CONFIG } from '../lib/config';

interface Props {
  personShares: PersonShare[];
  totalBill: number;
  month: string;
  verified: boolean;
  diff: number;
  onSharesChange: (shares: PersonShare[]) => void;
  onSave: () => void;
  saveStatus: 'idle' | 'saved' | 'error';
  onGistSave?: () => void;
  gistSaveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  gistEnabled?: boolean;
}

const GROUP_COLORS: Record<string, string> = {
  saket: 'bg-blue-50 border-blue-200',
  dari: 'bg-emerald-50 border-emerald-200',
  bajpayee: 'bg-amber-50 border-amber-200',
  mainali: 'bg-violet-50 border-violet-200',
  saroj: 'bg-red-50 border-red-200',
  chiranjiwi: 'bg-pink-50 border-pink-200',
};

const BADGE_COLORS: Record<string, string> = {
  saket: 'bg-blue-100 text-blue-800',
  dari: 'bg-emerald-100 text-emerald-800',
  bajpayee: 'bg-amber-100 text-amber-800',
  mainali: 'bg-violet-100 text-violet-800',
  saroj: 'bg-red-100 text-red-800',
  chiranjiwi: 'bg-pink-100 text-pink-800',
};

export default function BillResults({
  personShares,
  totalBill,
  month,
  verified,
  diff,
  onSharesChange,
  onSave,
  saveStatus,
  onGistSave,
  gistSaveStatus = 'idle',
  gistEnabled = false,
}: Props) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const displayTotal = personShares.reduce((s, p) => s + getPersonTotal(p), 0);
  const monthLabel = new Date(month + '-01').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  function updateShare(idx: number, updates: Partial<PersonShare>) {
    const updated = personShares.map((p, i) => (i === idx ? { ...p, ...updates } : p));
    onSharesChange(updated);
  }

  function toggleOverride(idx: number) {
    const p = personShares[idx];
    if (p.manualOverride !== undefined) {
      // Remove override
      updateShare(idx, { manualOverride: undefined });
    } else {
      // Set override to current calculated total
      updateShare(idx, { manualOverride: getPersonTotal(p) });
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-800">Bill Breakdown — {monthLabel}</h2>
          <p className="text-sm text-gray-500">
            Total bill: <strong>${totalBill.toFixed(2)}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Verification indicator */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
              verified
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <span>{verified ? '✓' : '⚠'}</span>
            {verified
              ? 'Verified'
              : `Off by $${Math.abs(diff).toFixed(2)}`}
          </div>
          <button
            onClick={onSave}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              saveStatus === 'saved'
                ? 'bg-green-500 text-white'
                : saveStatus === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-[#e20074] hover:bg-pink-700 text-white'
            }`}
          >
            {saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? 'Error' : '💾 Save'}
          </button>
          {gistEnabled && verified && onGistSave && (
            <button
              onClick={onGistSave}
              disabled={gistSaveStatus === 'saving'}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                gistSaveStatus === 'saved'
                  ? 'bg-green-500 text-white'
                  : gistSaveStatus === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-700 hover:bg-gray-900 text-white disabled:opacity-50'
              }`}
            >
              {gistSaveStatus === 'saved' ? '✓ Synced' : gistSaveStatus === 'error' ? 'Sync Error' : gistSaveStatus === 'saving' ? 'Syncing…' : '☁ Sync'}
            </button>
          )}
        </div>
      </div>

      {/* Verification bar */}
      {!verified && (
        <div className="px-6 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 flex items-center gap-2">
          <span>⚠</span>
          <span>
            Sum of shares (${displayTotal.toFixed(2)}) differs from total bill (${totalBill.toFixed(2)}) by $
            {Math.abs(diff).toFixed(2)}. Adjust amounts to match.
          </span>
        </div>
      )}

      {/* Progress bar showing distribution */}
      <div className="px-6 py-3 border-b border-gray-100">
        <div className="flex h-3 rounded-full overflow-hidden gap-px">
          {personShares.map((p, i) => {
            const pct = totalBill > 0 ? (getPersonTotal(p) / totalBill) * 100 : 0;
            const config = DEFAULT_CONFIG.accountGroups.find((g) => g.name === p.accountGroup);
            return (
              <div
                key={i}
                style={{ width: `${pct}%`, backgroundColor: config?.color ?? '#ccc' }}
                title={`${p.name}: $${getPersonTotal(p).toFixed(2)}`}
                className="transition-all"
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {personShares.map((p, i) => {
            const config = DEFAULT_CONFIG.accountGroups.find((g) => g.name === p.accountGroup);
            const pct = totalBill > 0 ? (getPersonTotal(p) / totalBill) * 100 : 0;
            return (
              <div key={i} className="flex items-center gap-1 text-xs text-gray-500">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: config?.color ?? '#ccc' }} />
                {p.name} ({pct.toFixed(1)}%)
              </div>
            );
          })}
        </div>
      </div>

      {/* Person rows */}
      <div className="divide-y divide-gray-100">
        {personShares.map((p, idx) => {
          const isEditing = editingIdx === idx;
          const total = getPersonTotal(p);
          const isOverridden = p.manualOverride !== undefined;
          const cardColor = GROUP_COLORS[p.accountGroup] ?? 'bg-gray-50 border-gray-200';
          const badgeColor = BADGE_COLORS[p.accountGroup] ?? 'bg-gray-100 text-gray-700';

          return (
            <div key={idx} className="px-6 py-4">
              <div className="flex items-start gap-4">
                {/* Name + lines */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColor}`}>
                      {p.name}
                    </span>
                    {isOverridden && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700 border border-yellow-200">
                        manual
                      </span>
                    )}
                  </div>
                  {p.lines.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Lines: {p.lines.join(', ')}
                    </p>
                  )}
                  {p.notes && (
                    <p className="text-xs text-amber-600 mt-0.5">📝 {p.notes}</p>
                  )}
                </div>

                {/* Breakdown (collapsed by default, shown when editing) */}
                <div className="text-right">
                  {!isEditing ? (
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          ${total.toFixed(2)}
                        </div>
                        {p.credits > 0 && (
                          <div className="text-xs text-green-600">-${p.credits.toFixed(2)} credit</div>
                        )}
                        {p.previousDue !== 0 && (
                          <div className={`text-xs ${p.previousDue > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {p.previousDue > 0 ? '+' : ''}{p.previousDue.toFixed(2)} prev
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setEditingIdx(isEditing ? null : idx)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 text-sm"
                        title="Edit"
                      >
                        ✏️
                      </button>
                    </div>
                  ) : (
                    <EditPanel
                      share={p}
                      onChange={(updates) => updateShare(idx, updates)}
                      onToggleOverride={() => toggleOverride(idx)}
                      onClose={() => setEditingIdx(null)}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer totals */}
      <div className={`px-6 py-4 border-t-2 ${verified ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700">Total distributed</span>
          <span className={`text-xl font-bold ${verified ? 'text-green-700' : 'text-red-700'}`}>
            ${displayTotal.toFixed(2)}
          </span>
        </div>
        {!verified && (
          <div className="text-xs text-red-600 mt-1">
            Expected: ${totalBill.toFixed(2)} · Difference: ${diff > 0 ? '+' : ''}{diff.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
}

interface EditPanelProps {
  share: PersonShare;
  onChange: (u: Partial<PersonShare>) => void;
  onToggleOverride: () => void;
  onClose: () => void;
}

function EditPanel({ share, onChange, onToggleOverride, onClose }: EditPanelProps) {
  const hasOverride = share.manualOverride !== undefined;

  return (
    <div className="text-left bg-gray-50 border border-gray-200 rounded-lg p-3 w-64 space-y-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-gray-600">Edit {share.name}</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
      </div>

      {hasOverride ? (
        <div>
          <label className="text-xs text-gray-500 block mb-1">Override Amount ($)</label>
          <input
            type="number"
            step="0.01"
            value={share.manualOverride ?? 0}
            onChange={(e) => onChange({ manualOverride: parseFloat(e.target.value) || 0 })}
            className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:ring-1 focus:ring-pink-300 outline-none"
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Field label="Line Charges ($)" value={share.lineCharges}
            onChange={(v) => onChange({ lineCharges: v })} />
          <Field label="Shared Cost Share ($)" value={share.sharedCostShare}
            onChange={(v) => onChange({ sharedCostShare: v })} />
          <Field label="Credits ($)" value={share.credits}
            onChange={(v) => onChange({ credits: v })} />
          <Field label="Previous Due ($)" value={share.previousDue}
            onChange={(v) => onChange({ previousDue: v })} />
          <Field label="Paid ($)" value={share.paid}
            onChange={(v) => onChange({ paid: v })} />
        </div>
      )}

      <div>
        <label className="text-xs text-gray-500 block mb-1">Notes</label>
        <input
          type="text"
          value={share.notes ?? ''}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Optional note"
          className="border border-gray-300 rounded px-2 py-1 text-xs w-full focus:ring-1 focus:ring-pink-300 outline-none"
        />
      </div>

      <button
        onClick={onToggleOverride}
        className="text-xs text-[#e20074] hover:underline"
      >
        {hasOverride ? '← Use calculated breakdown' : '→ Override with single amount'}
      </button>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-400 block">{label}</label>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="border border-gray-300 rounded px-2 py-1 text-xs w-full focus:ring-1 focus:ring-pink-300 outline-none"
      />
    </div>
  );
}
