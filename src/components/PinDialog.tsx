import { useState } from 'react';

interface Props {
  title?: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}

export default function PinDialog({
  title = 'Save to Gist',
  description = 'Enter the shared PIN to persist changes.',
  confirmLabel = 'Save',
  onConfirm,
  onCancel,
  saving,
  error,
}: Props) {
  const [pin, setPin] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-80 max-w-full">
        <h2 className="text-lg font-bold text-gray-800 mb-1">{title}</h2>
        <p className="text-sm text-gray-500 mb-4">{description}</p>
        <input
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && pin && !saving) onConfirm(pin);
          }}
          placeholder="PIN"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-[#e20074]"
          autoFocus
        />
        {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
        <div className="flex gap-2 justify-end mt-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={!pin || saving}
            onClick={() => onConfirm(pin)}
            className="px-4 py-2 text-sm font-medium bg-[#e20074] text-white rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
