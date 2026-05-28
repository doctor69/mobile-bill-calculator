import type { MonthRecord } from './types';

// Historical bill data extracted from T-Mobile.xlsx
// Per-person amounts represent what each person owes for that month
export const HISTORY: MonthRecord[] = [
  // ── 2025 ──────────────────────────────────────────────────────────────────
  {
    month: '2025-01',
    totalBill: 356.82,
    verified: true,
    verifiedTotal: 356.80,
    savedAt: '2025-01-31',
    notes: 'Jan 2025',
    personShares: [
      { name: 'Saket (Me)', accountGroup: 'saket', lines: ['Saket'], lineCharges: 88.83, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 88.83, paid: 0, balance: 88.83 },
      { name: 'Dari / Sanjay', accountGroup: 'dari', lines: ['Sanjay'], lineCharges: 33.83, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 33.83, paid: 0, balance: 33.83 },
      { name: 'Saroj / Ritesh', accountGroup: 'saroj', lines: ['Saroj', 'Ritesh'], lineCharges: 63.83, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 63.83, paid: 0, balance: 63.83 },
      { name: 'Chiranjiwi', accountGroup: 'chiranjiwi', lines: ['Chiranjiwi'], lineCharges: 33.83, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 33.83, paid: 0, balance: 33.83 },
      { name: 'Mainali', accountGroup: 'mainali', lines: ['Bikas'], lineCharges: 35.99, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 35.99, paid: 0, balance: 35.99 },
      { name: 'Bajpayee', accountGroup: 'bajpayee', lines: ['Bajpayee', 'Sapana iPhone'], lineCharges: 100.49, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 100.49, paid: 0, balance: 100.49 },
    ],
  },
  {
    month: '2025-02',
    totalBill: 356.82,
    verified: true,
    verifiedTotal: 356.80,
    savedAt: '2025-02-28',
    notes: 'Feb 2025',
    personShares: [
      { name: 'Saket (Me)', accountGroup: 'saket', lines: ['Saket'], lineCharges: 88.83, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 88.83, paid: 0, balance: 88.83 },
      { name: 'Dari / Sanjay', accountGroup: 'dari', lines: ['Sanjay'], lineCharges: 33.83, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 33.83, paid: 0, balance: 33.83 },
      { name: 'Saroj / Ritesh', accountGroup: 'saroj', lines: ['Saroj', 'Ritesh'], lineCharges: 63.83, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 63.83, paid: 0, balance: 63.83 },
      { name: 'Chiranjiwi', accountGroup: 'chiranjiwi', lines: ['Chiranjiwi'], lineCharges: 33.83, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 33.83, paid: 0, balance: 33.83 },
      { name: 'Mainali', accountGroup: 'mainali', lines: ['Bikas'], lineCharges: 35.99, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 35.99, paid: 0, balance: 35.99 },
      { name: 'Bajpayee', accountGroup: 'bajpayee', lines: ['Bajpayee', 'Sapana iPhone'], lineCharges: 100.49, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 100.49, paid: 0, balance: 100.49 },
    ],
  },
  {
    month: '2025-03',
    totalBill: 356.82,
    verified: true,
    verifiedTotal: 356.80,
    savedAt: '2025-03-31',
    notes: 'Mar 2025',
    personShares: [
      { name: 'Saket (Me)', accountGroup: 'saket', lines: ['Saket'], lineCharges: 88.83, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 88.83, paid: 0, balance: 88.83 },
      { name: 'Dari / Sanjay', accountGroup: 'dari', lines: ['Sanjay'], lineCharges: 33.83, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 33.83, paid: 0, balance: 33.83 },
      { name: 'Saroj / Ritesh', accountGroup: 'saroj', lines: ['Saroj', 'Ritesh'], lineCharges: 63.83, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 63.83, paid: 0, balance: 63.83 },
      { name: 'Chiranjiwi', accountGroup: 'chiranjiwi', lines: ['Chiranjiwi'], lineCharges: 33.83, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 33.83, paid: 0, balance: 33.83 },
      { name: 'Mainali', accountGroup: 'mainali', lines: ['Bikas'], lineCharges: 35.99, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 35.99, paid: 0, balance: 35.99 },
      { name: 'Bajpayee', accountGroup: 'bajpayee', lines: ['Bajpayee', 'Sapana iPhone'], lineCharges: 100.49, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 100.49, paid: 0, balance: 100.49 },
    ],
  },
  {
    month: '2025-04',
    totalBill: 407.23,
    verified: true,
    verifiedTotal: 407.21,
    savedAt: '2025-04-30',
    notes: 'Apr 2025 – plan price increased $5 for all lines',
    personShares: [
      { name: 'Saket (Me)', accountGroup: 'saket', lines: ['Saket'], lineCharges: 93.83, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 93.83, paid: 0, balance: 93.83 },
      { name: 'Dari / Sanjay', accountGroup: 'dari', lines: ['Sanjay'], lineCharges: 38.83, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 38.83, paid: 0, balance: 38.83 },
      { name: 'Saroj / Ritesh', accountGroup: 'saroj', lines: ['Saroj', 'Ritesh'], lineCharges: 84.24, sharedCostShare: 0, credits: 0, extras: 10.41, previousDue: 0, total: 84.24, paid: 0, balance: 84.24, notes: 'Ritesh roaming $10.41' },
      { name: 'Chiranjiwi', accountGroup: 'chiranjiwi', lines: ['Chiranjiwi'], lineCharges: 38.83, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 38.83, paid: 0, balance: 38.83 },
      { name: 'Mainali', accountGroup: 'mainali', lines: ['Bikas'], lineCharges: 40.99, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 40.99, paid: 0, balance: 40.99 },
      { name: 'Bajpayee', accountGroup: 'bajpayee', lines: ['Bajpayee', 'Sapana iPhone'], lineCharges: 110.49, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 110.49, paid: 0, balance: 110.49 },
    ],
  },
  {
    month: '2025-05',
    totalBill: 407.23,
    verified: true,
    verifiedTotal: 407.21,
    savedAt: '2025-05-31',
    notes: 'May 2025',
    personShares: [
      { name: 'Saket (Me)', accountGroup: 'saket', lines: ['Saket'], lineCharges: 93.83, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 93.83, paid: 0, balance: 93.83 },
      { name: 'Dari / Sanjay', accountGroup: 'dari', lines: ['Sanjay'], lineCharges: 38.83, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 38.83, paid: 0, balance: 38.83 },
      { name: 'Saroj / Ritesh', accountGroup: 'saroj', lines: ['Saroj', 'Ritesh'], lineCharges: 73.66, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 73.66, paid: 0, balance: 73.66 },
      { name: 'Chiranjiwi', accountGroup: 'chiranjiwi', lines: ['Chiranjiwi'], lineCharges: 38.83, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 38.83, paid: 0, balance: 38.83 },
      { name: 'Mainali', accountGroup: 'mainali', lines: ['Bikas'], lineCharges: 40.99, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 40.99, paid: 0, balance: 40.99 },
      { name: 'Bajpayee', accountGroup: 'bajpayee', lines: ['Bajpayee', 'Sapana iPhone'], lineCharges: 110.49, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 110.49, paid: 0, balance: 110.49 },
    ],
  },
  {
    month: '2025-06',
    totalBill: 672.27,
    verified: true,
    verifiedTotal: 672.26,
    savedAt: '2025-06-30',
    notes: 'Jun 2025 – iPhone 16 upgrades; full equipment costs before credits applied',
    personShares: [
      { name: 'Saket (Me)', accountGroup: 'saket', lines: ['Saket', 'Saket iPhone'], lineCharges: 166.69, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 166.69, paid: 0, balance: 166.69 },
      { name: 'Dari / Sanjay', accountGroup: 'dari', lines: ['Sanjay', 'Dari iPhone'], lineCharges: 80.09, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 80.09, paid: 0, balance: 80.09 },
      { name: 'Saroj / Ritesh', accountGroup: 'saroj', lines: ['Saroj', 'Ritesh', 'Saroj iPhone'], lineCharges: 73.01, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 73.01, paid: 0, balance: 73.01 },
      { name: 'Chiranjiwi', accountGroup: 'chiranjiwi', lines: ['Chiranjiwi'], lineCharges: 59.05, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 59.05, paid: 0, balance: 59.05 },
      { name: 'Mainali', accountGroup: 'mainali', lines: ['Bikas', 'Mainali iPhone'], lineCharges: 61.21, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 61.21, paid: 0, balance: 61.21 },
      { name: 'Bajpayee', accountGroup: 'bajpayee', lines: ['Bajpayee', 'Sapana iPhone', 'Bajpayee iPhone'], lineCharges: 176.97, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 176.97, paid: 0, balance: 176.97 },
    ],
  },
  {
    month: '2025-07',
    totalBill: 565.51,
    verified: true,
    verifiedTotal: 565.51,
    savedAt: '2025-07-31',
    notes: 'Jul 2025 – credits applied: Sanjay $225, Saket $255, Saroj/Ritesh $305, Mainali $135',
    personShares: [
      { name: 'Saket (Me)', accountGroup: 'saket', lines: ['Saket', 'Saket iPhone'], lineCharges: 91.69, sharedCostShare: 0, credits: 255, extras: 0, previousDue: 0, total: 91.69, paid: 0, balance: 91.69 },
      { name: 'Dari / Sanjay', accountGroup: 'dari', lines: ['Sanjay', 'Dari iPhone'], lineCharges: 80.09, sharedCostShare: 0, credits: 225, extras: 0, previousDue: 0, total: 80.09, paid: 0, balance: 80.09 },
      { name: 'Saroj / Ritesh', accountGroup: 'saroj', lines: ['Saroj', 'Ritesh', 'Saroj iPhone'], lineCharges: 73.01, sharedCostShare: 0, credits: 305, extras: 0.75, previousDue: 0, total: 73.01, paid: 0, balance: 73.01, notes: 'Mama roaming $0.75' },
      { name: 'Chiranjiwi', accountGroup: 'chiranjiwi', lines: ['Chiranjiwi'], lineCharges: 59.80, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 59.80, paid: 0, balance: 59.80 },
      { name: 'Mainali', accountGroup: 'mainali', lines: ['Bikas', 'Mainali iPhone'], lineCharges: 61.21, sharedCostShare: 0, credits: 135, extras: 0, previousDue: 0, total: 61.21, paid: 0, balance: 61.21 },
      { name: 'Bajpayee', accountGroup: 'bajpayee', lines: ['Bajpayee', 'Sapana iPhone', 'Bajpayee iPhone'], lineCharges: 144.46, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 144.46, paid: 0, balance: 144.46 },
    ],
  },
  {
    month: '2025-08',
    totalBill: 575.10,
    verified: false,
    verifiedTotal: 0,
    savedAt: '2025-08-31',
    notes: 'Aug 2025 – estimated based on plan structure',
    personShares: [
      { name: 'Saket (Me)', accountGroup: 'saket', lines: ['Saket', 'Saket iPhone'], lineCharges: 91.69, sharedCostShare: 0, credits: 23.06, extras: 0, previousDue: 0, total: 68.63, paid: 0, balance: 68.63 },
      { name: 'Dari / Sanjay', accountGroup: 'dari', lines: ['Sanjay', 'Dari iPhone'], lineCharges: 80.09, sharedCostShare: 0, credits: 23.06, extras: 0, previousDue: 0, total: 57.03, paid: 0, balance: 57.03 },
      { name: 'Saroj / Ritesh', accountGroup: 'saroj', lines: ['Saroj', 'Ritesh', 'Saroj iPhone'], lineCharges: 73.01, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 73.01, paid: 0, balance: 73.01 },
      { name: 'Chiranjiwi', accountGroup: 'chiranjiwi', lines: ['Chiranjiwi'], lineCharges: 59.80, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 59.80, paid: 0, balance: 59.80 },
      { name: 'Mainali', accountGroup: 'mainali', lines: ['Bikas', 'Mainali iPhone'], lineCharges: 61.21, sharedCostShare: 0, credits: 17.50, extras: 0, previousDue: 0, total: 43.71, paid: 0, balance: 43.71 },
      { name: 'Bajpayee', accountGroup: 'bajpayee', lines: ['Bajpayee', 'Sapana iPhone', 'Bajpayee iPhone'], lineCharges: 144.46, sharedCostShare: 0, credits: 35.56, extras: 0, previousDue: 0, total: 108.90, paid: 0, balance: 108.90 },
    ],
  },
  // ── 2024 ──────────────────────────────────────────────────────────────────
  {
    month: '2024-01',
    totalBill: 406.14,
    verified: true,
    verifiedTotal: 406.14,
    savedAt: '2024-01-31',
    notes: 'Jan 2024',
    personShares: [
      { name: 'Saket (Me)', accountGroup: 'saket', lines: ['Saket'], lineCharges: 110.58, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 110.58, paid: 0, balance: 110.58 },
      { name: 'Dari / Sanjay', accountGroup: 'dari', lines: ['Sanjay'], lineCharges: 86.08, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 86.08, paid: 0, balance: 86.08 },
      { name: 'Saroj / Ritesh', accountGroup: 'saroj', lines: ['Saroj', 'Ritesh'], lineCharges: 70.83, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 70.83, paid: 0, balance: 70.83 },
      { name: 'Chiranjiwi', accountGroup: 'chiranjiwi', lines: ['Chiranjiwi'], lineCharges: 34.33, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 34.33, paid: 0, balance: 34.33 },
      { name: 'Mainali', accountGroup: 'mainali', lines: ['Bikas'], lineCharges: 40.33, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 40.33, paid: 0, balance: 40.33 },
      { name: 'Bajpayee', accountGroup: 'bajpayee', lines: ['Bajpayee'], lineCharges: 63.99, sharedCostShare: 0, credits: 0, extras: 0, previousDue: 0, total: 63.99, paid: 0, balance: 63.99 },
    ],
  },
];

export function getHistoryMonth(month: string): MonthRecord | undefined {
  return HISTORY.find((r) => r.month === month);
}

export function getRecentHistory(n = 12): MonthRecord[] {
  return [...HISTORY].sort((a, b) => b.month.localeCompare(a.month)).slice(0, n);
}
