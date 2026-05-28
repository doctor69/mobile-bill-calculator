import { useState } from 'react';
import type { MonthRecord, PersonShare } from '../lib/types';
import { getPersonTotal } from '../lib/calculator';
import { exportAllAsJSON, importFromJSON, deleteRecord, loadAllRecords } from '../lib/storage';

interface Props {
  records: MonthRecord[];
  onLoadRecord: (r: MonthRecord) => void;
}

export default function HistoryTable({ records, onLoadRecord }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const sorted = [...records]
    .filter((r) => !filter || r.month.includes(filter))
    .sort((a, b) => b.month.localeCompare(a.month));

  function handleExport() {
    const json = exportAllAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tmobile-history.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const count = importFromJSON(ev.target?.result as string);
        alert(`Imported ${count} records. Refresh to see changes.`);
      } catch {
        alert('Import failed: invalid JSON');
      }
    };
    reader.readAsText(file);
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-4xl mb-3">📋</div>
        <h3 className="font-semibold text-gray-700">No bill history yet</h3>
        <p className="text-gray-400 text-sm mt-1">Upload a T-Mobile PDF or use Manual Entry to add your first record.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Bill History</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter by year/month"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-pink-300 focus:border-pink-400 outline-none"
            />
            <button
              onClick={handleExport}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              ↓ Export
            </button>
            <label className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
              ↑ Import
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-2 text-gray-500 font-medium">Month</th>
              <th className="px-4 py-2 text-gray-500 font-medium">Total Bill</th>
              <th className="px-4 py-2 text-gray-500 font-medium hidden sm:table-cell">Verified</th>
              <th className="px-4 py-2 text-gray-500 font-medium hidden md:table-cell">Notes</th>
              <th className="px-4 py-2 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((record) => {
              const isExpanded = expanded === record.month;
              const label = new Date(record.month + '-01').toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              });
              return (
                <>
                  <tr
                    key={record.month}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : record.month)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      <span className="flex items-center gap-1">
                        <span>{isExpanded ? '▼' : '▶'}</span>
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">
                      ${record.totalBill.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        record.verified
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {record.verified ? '✓ Verified' : '⚠ Unverified'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell truncate max-w-[200px]">
                      {record.notes}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); onLoadRecord(record); }}
                        className="px-2 py-1 bg-[#e20074] hover:bg-pink-700 text-white rounded text-xs font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${record.month}-detail`}>
                      <td colSpan={5} className="px-6 py-4 bg-gray-50">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {record.personShares.map((p: PersonShare, i: number) => (
                            <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
                              <div className="font-medium text-gray-700 text-sm">{p.name}</div>
                              <div className="text-lg font-bold text-gray-900">
                                ${getPersonTotal(p).toFixed(2)}
                              </div>
                              {p.credits > 0 && (
                                <div className="text-xs text-green-600">Credit: -${p.credits.toFixed(2)}</div>
                              )}
                              {p.notes && (
                                <div className="text-xs text-amber-600 mt-0.5">{p.notes}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
