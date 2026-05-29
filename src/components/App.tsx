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
import PinDialog from './PinDialog';
import { isGistEnabled, loadFromGist, saveToGist } from '../lib/gistStorage';

type Tab = 'dashboard' | 'upload' | 'history' | 'credits';

const TAB_LABELS: Record<Tab, string> = {
  dashboard: '🏠 Overview',
  upload:    '📄 Calculator',
  history:   '📋 History',
  credits:   '⚙️ Credits',
};

const TAB_ICONS: Record<Tab, string> = {
  dashboard: '🏠',
  upload:    '📄',
  history:   '📋',
  credits:   '⚙️',
};

const TAB_SHORT: Record<Tab, string> = {
  dashboard: 'Overview',
  upload:    'Calculator',
  history:   'History',
  credits:   'Credits',
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
  const [gistLoading, setGistLoading] = useState(false);
  const [pinDialog, setPinDialog] = useState<'closed' | 'save' | 'migrate'>('closed');
  const [pinSaving, setPinSaving] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [gistSaveStatus, setGistSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const stored = loadAllRecords();
    const historyMonths = new Set(HISTORY.map((h) => h.month));

    // Show local data immediately while Gist loads
    const localMerged = [
      ...HISTORY,
      ...stored.filter((s) => !historyMonths.has(s.month)),
    ].sort((a, b) => b.month.localeCompare(a.month));
    setSavedRecords(localMerged);

    if (!isGistEnabled()) return;
    setGistLoading(true);
    loadFromGist().then((gistRecords) => {
      setGistLoading(false);
      if (!gistRecords.length) return;
      // Gist is the source of truth — it overrides HISTORY and localStorage
      const gistMonths = new Set(gistRecords.map((r) => r.month));
      const merged = [
        ...gistRecords,
        ...HISTORY.filter((r) => !gistMonths.has(r.month)),
        ...stored.filter((r) => !gistMonths.has(r.month) && !historyMonths.has(r.month)),
      ].sort((a, b) => b.month.localeCompare(a.month));
      setSavedRecords(merged);
    });
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

  async function handlePinConfirm(pin: string) {
    setPinSaving(true);
    setPinError(null);

    if (pinDialog === 'save') {
      const currentRecord: MonthRecord = {
        month,
        totalBill,
        personShares,
        verified,
        verifiedTotal: personShares.reduce((s, p) => s + getPersonTotal(p), 0),
        notes: parsedBill?.rawText ? undefined : 'Manual entry',
        savedAt: new Date().toISOString().slice(0, 10),
      };
      // Upsert current month into the full records list
      const updated = savedRecords.some((r) => r.month === month)
        ? savedRecords.map((r) => (r.month === month ? currentRecord : r))
        : [currentRecord, ...savedRecords].sort((a, b) => b.month.localeCompare(a.month));

      const result = await saveToGist(updated, pin);
      if (result === 'ok') {
        setSavedRecords(updated);
        handleSave();
        setPinDialog('closed');
        setGistSaveStatus('saved');
        setTimeout(() => setGistSaveStatus('idle'), 3000);
      } else if (result === 'wrong_pin') {
        setPinError('Incorrect PIN. Try again.');
      } else {
        setPinError('Save failed. Check your connection.');
      }
    } else if (pinDialog === 'migrate') {
      const result = await saveToGist(savedRecords, pin);
      if (result === 'ok') {
        setPinDialog('closed');
      } else if (result === 'wrong_pin') {
        setPinError('Incorrect PIN. Try again.');
      } else {
        setPinError('Migration failed. Check your connection.');
      }
    }

    setPinSaving(false);
  }

  const diff = personShares.length ? getVerificationDiff(personShares, totalBill) : 0;
  const verified = Math.abs(diff) < 0.02;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-[#e20074] shadow-lg">
        {/* Logo + title row (+ desktop nav inline) */}
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-[#e20074] font-black text-base leading-none">T</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">T-Mobile Bill Splitter</h1>
                <p className="text-pink-200 text-xs">Account 969064451 · Sanjay</p>
              </div>
            </div>

            {/* Desktop nav — hidden on mobile */}
            <nav className="hidden sm:flex gap-1">
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

        {/* Mobile nav — full-width tab bar, hidden on sm+ */}
        <nav className="sm:hidden flex border-t border-pink-600/50">
          {(['dashboard', 'upload', 'history', 'credits'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${
                tab === t
                  ? 'bg-white/20 text-white'
                  : 'text-pink-200 hover:bg-white/10'
              }`}
            >
              <span className="text-lg leading-none">{TAB_ICONS[t]}</span>
              <span className="text-[10px] font-medium">{TAB_SHORT[t]}</span>
            </button>
          ))}
        </nav>
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
                gistEnabled={isGistEnabled()}
                gistSaveStatus={gistSaveStatus}
                onGistSave={() => {
                  setPinError(null);
                  setPinDialog('save');
                }}
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
          <>
            <CreditConfig config={DEFAULT_CONFIG} />
            {isGistEnabled() && (
              <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Gist Storage</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Move all history into the Gist so it becomes the single source of truth across devices.
                </p>
                <button
                  onClick={() => { setPinError(null); setPinDialog('migrate'); }}
                  className="px-4 py-2 text-sm font-medium bg-gray-700 hover:bg-gray-900 text-white rounded-lg"
                >
                  ☁ Migrate All History to Gist
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {gistLoading && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
          Loading from Gist…
        </div>
      )}

      {pinDialog !== 'closed' && (
        <PinDialog
          title={pinDialog === 'migrate' ? 'Migrate History to Gist' : 'Sync to Gist'}
          description={
            pinDialog === 'migrate'
              ? 'This will write all records to the Gist as the permanent store. Enter your PIN to confirm.'
              : "Enter the shared PIN to persist this month's record."
          }
          confirmLabel={pinDialog === 'migrate' ? 'Migrate' : 'Sync'}
          onConfirm={handlePinConfirm}
          onCancel={() => setPinDialog('closed')}
          saving={pinSaving}
          error={pinError}
        />
      )}
    </div>
  );
}
