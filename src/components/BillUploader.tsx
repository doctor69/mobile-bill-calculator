import { useRef, useState } from 'react';

interface Props {
  onFileUpload: (file: File) => void;
  onManualEntry: (total: number, month: string) => void;
  parsing: boolean;
  parseError: string | null;
  month: string;
  totalBill: number;
  onMonthChange: (m: string) => void;
  onTotalChange: (t: number) => void;
}

export default function BillUploader({
  onFileUpload,
  onManualEntry,
  parsing,
  parseError,
  month,
  totalBill,
  onMonthChange,
  onTotalChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [mode, setMode] = useState<'upload' | 'manual'>('upload');
  const [manualTotal, setManualTotal] = useState('');

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') onFileUpload(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
  }

  function handleManualSubmit() {
    const total = parseFloat(manualTotal);
    if (!isNaN(total) && total > 0) {
      onManualEntry(total, month);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Upload T-Mobile Bill</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setMode('upload')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              mode === 'upload' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'
            }`}
          >
            PDF Upload
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              mode === 'manual' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'
            }`}
          >
            Manual Entry
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Month selector always visible */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Bill Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-300 focus:border-pink-400 outline-none"
          />
        </div>

        {mode === 'upload' ? (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                dragging
                  ? 'border-pink-400 bg-pink-50'
                  : 'border-gray-300 hover:border-pink-300 hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              {parsing ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-pink-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-500 text-sm">Parsing PDF...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="text-4xl">📄</div>
                  <div>
                    <p className="font-medium text-gray-700">Drop DetailedBill PDF here</p>
                    <p className="text-sm text-gray-400 mt-1">or click to browse</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    PDF is read locally — never uploaded. Bill data is saved as JSON only.
                  </p>
                </div>
              )}
            </div>

            {parseError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <strong>Parse error:</strong> {parseError}
                <br />
                <span className="text-xs">Try Manual Entry mode to enter totals directly.</span>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Bill Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 356.82"
                value={manualTotal}
                onChange={(e) => setManualTotal(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-xs focus:ring-2 focus:ring-pink-300 focus:border-pink-400 outline-none"
              />
            </div>
            <button
              onClick={handleManualSubmit}
              disabled={!manualTotal || isNaN(parseFloat(manualTotal))}
              className="bg-[#e20074] hover:bg-pink-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Calculate Split
            </button>
            <p className="text-xs text-gray-400">
              Enter the total from your T-Mobile bill, then adjust individual amounts below.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
