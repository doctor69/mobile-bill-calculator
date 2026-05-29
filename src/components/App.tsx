import { useState, useEffect } from 'react';
import type { ParsedBill, MonthRecord, PersonShare } from '../lib/types';
import { DEFAULT_CONFIG } from '../lib/config';
import { calculateBillSplit, getPersonTotal, getVerificationDiff } from '../lib/calculator';
import { extractTextFromPDF, parseTMobileBillText, detectMonth } from '../lib/parser';
import { saveRecord, loadRecord, loadAllRecords } from '../lib/storage';
import { HISTORY } from '../lib/historyData';
import BillUploader from './BillUploader';
import BillResults from './BillResults';
import HistoryTable from './HistoryTable';
import CreditConfig from './CreditConfig';
import Dashboard from './Dashboard';

type Tab = 'dashboard' | 'upload' | 'history' | 'credits';

const TAB_LABELS: Record<Tab, string> = {
  dashboard: '🏠 Overview',
  upload:    '📄 Calculator',
  history:   '📋 History',
  credits:   '⚙️ Credits',
};

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedBill, setParsedBill] = useState<ParsedBill | null>(null);
  const [personShares, setPersonShares] = useState<PersonShare[]>([]);
  const [totalBill, setTotalBill] = useState(0);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [savedRecords, setSavedRecords] = useState<MonthRecord[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const stored = loadAllRecords();
    // HISTORY is the canonical source of truth for historical months.
    // localStorage is only kept for months NOT covered by HISTORY (e.g. a freshly uploaded PDF).
    const historyMonths = new Set(HISTORY.map((h) => h.month));
    const merged = [
      ...HISTORY,
      ...stored.filter((s) => !historyMonths.has(s.month)),
    ].sort((a, b) => b.month.localeCompare(a.month));
    setSavedRecords(merged);
  }, []);

  async function handleFileUpload(file: File) {
    setParsing(true);
    setParseError(null);
    try {
      const text = await extractTextFromPDF(file);
      const detectedMonth = detectMonth(file.name, text);
      setMonth(detectedMonth);
      const bill = parseTMobileBillText(text, detectedMonth);
      setParsedBill(bill);
      setTotalBill(bill.totalDue || 0);

      const prevRecord = loadRecord(detectedMonth);
      const prevBalances: Record<string, number> = {};
      if (!prevRecord) {
        const sortedHistory = savedRecords.filter((r) => r.month < detectedMonth);
        if (sortedHistory.length > 0) {
          const latest = sortedHistory[0];
          for (const p of latest.personShares) {
            prevBalances[p.accountGroup] = p.balance - p.paid;
          }
        }
      }

      const shares = calculateBillSplit(bill, DEFAULT_CONFIG, prevBalances);
      setPersonShares(shares);
      setTab('upload');
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse PDF');
      setTab('upload');
    } finally {
      setParsing(false);
    }
  }

  function handleManualEntry(totalAmount: number, selectedMonth: string) {
    setTotalBill(totalAmount);
    setMonth(selectedMonth);
    const bill: ParsedBill = {
      month: selectedMonth,
      totalDue: totalAmount,
      lineItems: [],
      sharedCosts: { homeInternet: 0, streaming: 0, basePlan: 0, other: 0 },
    };
    setParsedBill(bill);
    const shares = calculateBillSplit(bill, DEFAULT_CONFIG, {});
    setPersonShares(shares.map((s) => ({ ...s, total: 0, balance: 0 })));
    setTab('upload');
  }

  function handleSharesChange(updated: PersonShare[]) {
    setPersonShares(updated);
  }

  function handleSave() {
    if (!personShares.length) return;
    const diff = getVerificationDiff(personShares, totalBill);
    const record: MonthRecord = {
      month,
      totalBill,
      personShares,
      verified: Math.abs(diff) < 0.02,
      verifiedTotal: personShares.reduce((s, p) => s + getPersonTotal(p), 0),
      notes: parsedBill?.rawText ? undefined : 'Manual entry',
      savedAt: new Date().toISOString().slice(0, 10),
    };
    try {
      saveRecord(record);
      setSavedRecords((prev) => {
        const idx = prev.findIndex((r) => r.month === month);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = record;
          return next.sort((a, b) => b.month.localeCompare(a.month));
        }
        return [record, ...prev].sort((a, b) => b.month.localeCompare(a.month));
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    }
  }

  function handleLoadHistory(record: MonthRecord) {
    setMonth(record.month);
    setTotalBill(record.totalBill);
    setPersonShares(record.personShares);
    setParsedBill(null);
    setTab('upload');
  }

  const diff = personShares.length ? getVerificationDiff(personShares, totalBill) : 0;
  const verified = Math.abs(diff) < 0.02;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-[#e20074] shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo + title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-[#e20074] font-black text-base leading-none">T</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">T-Mobile Bill Splitter</h1>
                <p className="text-pink-200 text-xs">Account 969064451 · Sanjay</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex gap-1">
              {(['dashboard', 'upload', 'history', 'credits'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    tab === t
                      ? 'bg-white text-[#e20074] shadow-sm'
                      : 'text-pink-100 hover:bg-white/10'
                  }`}
                >
                  {TAB_LABELS[t]}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'dashboard' && (
          <Dashboard records={savedRecords} />
        )}

        {tab === 'upload' && (
          <div className="space-y-6">
            <BillUploader
              onFileUpload={handleFileUpload}
              onManualEntry={handleManualEntry}
              parsing={parsing}
              parseError={parseError}
              month={month}
              totalBill={totalBill}
              onMonthChange={setMonth}
              onTotalChange={setTotalBill}
            />

            {personShares.length > 0 && (
              <BillResults
                personShares={personShares}
                totalBill={totalBill}
                month={month}
                verified={verified}
                diff={diff}
                onSharesChange={handleSharesChange}
                onSave={handleSave}
                saveStatus={saveStatus}
              />
            )}
          </div>
        )}

        {tab === 'history' && (
          <HistoryTable
            records={savedRecords}
            onLoadRecord={handleLoadHistory}
          />
        )}

        {tab === 'credits' && (
          <CreditConfig config={DEFAULT_CONFIG} />
        )}
      </main>
    </div>
  );
}
