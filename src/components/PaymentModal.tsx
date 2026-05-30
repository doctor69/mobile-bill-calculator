import { useState } from 'react';
import type { Payment } from '../lib/types';

interface Props {
  fromGroup: string;
  fromName: string;
  balSaket: number;
  balSanjay: number;
  onSubmit: (draft: Omit<Payment, 'id' | 'date'>) => void;
  onCancel: () => void;
}

const METHODS: Array<{ value: Payment['method']; label: string; icon: string }> = [
  { value: 'venmo',  label: 'Venmo',  icon: '💳' },
  { value: 'zelle',  label: 'Zelle',  icon: '🏦' },
  { value: 'cash',   label: 'Cash',   icon: '💵' },
  { value: 'bank',   label: 'Bank',   icon: '🏛' },
  { value: 'other',  label: 'Other',  icon: '•••' },
];

export default function PaymentModal({ fromGroup, fromName, balSaket, balSanjay, onSubmit, onCancel }: Props) {
  const defaultPayee: 'saket' | 'sanjay' = balSaket > 0.01 ? 'saket' : 'sanjay';
  const [toPayee, setToPayee] = useState<'saket' | 'sanjay'>(defaultPayee);
  const [amount, setAmount] = useState(() =>
    (balSaket > 0.01 ? balSaket : balSanjay).toFixed(2)
  );
  const [method, setMethod] = useState<Payment['method']>('venmo');
  const [note, setNote] = useState('');

  const currentBal = toPayee === 'saket' ? balSaket : balSanjay;
  const parsedAmount = parseFloat(amount) || 0;
  const amountOver = parsedAmount > currentBal + 0.01;
  const isValid = parsedAmount > 0 && !amountOver;

  function handlePayeeChange(p: 'saket' | 'sanjay') {
    setToPayee(p);
    setAmount((p === 'saket' ? balSaket : balSanjay).toFixed(2));
  }

  function handleSubmit() {
    if (!isValid) return;
    onSubmit({ fromGroup, fromName, toPayee, amount: parsedAmount, method, note: note.trim() || undefined });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-5 py-4">
          <h2 className="text-white font-bold text-lg">Record a Payment</h2>
          <p className="text-gray-400 text-sm mt-0.5">{fromName}</p>
        </div>

        <div className="p-5 space-y-4">

          {/* Outstanding balances */}
          <div className={`grid gap-2 ${balSaket > 0.01 && balSanjay > 0.01 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {balSaket > 0.01 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-center">
                <div className="text-xs text-blue-500 font-medium">Owed to Saket</div>
                <div className="text-lg font-bold text-blue-700">${balSaket.toFixed(2)}</div>
              </div>
            )}
            {balSanjay > 0.01 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-center">
                <div className="text-xs text-emerald-600 font-medium">Owed to Sanjay</div>
                <div className="text-lg font-bold text-emerald-700">${balSanjay.toFixed(2)}</div>
              </div>
            )}
          </div>

          {/* Who to pay (only shown when both have balance) */}
          {balSaket > 0.01 && balSanjay > 0.01 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pay To</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePayeeChange('saket')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    toPayee === 'saket'
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  🔵 Saket
                </button>
                <button
                  onClick={() => handlePayeeChange('sanjay')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    toPayee === 'sanjay'
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'
                  }`}
                >
                  🟢 Sanjay
                </button>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {amountOver && (
              <p className="text-xs text-red-500 mt-1">Exceeds outstanding balance (${currentBal.toFixed(2)})</p>
            )}
          </div>

          {/* Method */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">How Paid</label>
            <div className="grid grid-cols-5 gap-1.5">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={`py-2 rounded-xl text-xs font-medium flex flex-col items-center gap-0.5 border transition-colors ${
                    method === m.value
                      ? 'bg-gray-800 border-gray-800 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <span className="text-base leading-none">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Note <span className="text-gray-300 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && isValid) handleSubmit(); }}
              placeholder="e.g. May 2026 bill payment"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold disabled:opacity-40 hover:bg-gray-700 transition-colors"
          >
            Next: Enter PIN →
          </button>
        </div>
      </div>
    </div>
  );
}
