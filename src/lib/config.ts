import type { AppConfig } from './types';

export const DEFAULT_CONFIG: AppConfig = {
  accountGroups: [
    {
      name: 'saket',
      displayName: 'Saket (Me)',
      color: '#3b82f6',
      lines: ['Saket', 'Saket iPhone', 'Dadha Router', 'Home Internet', 'Dada iPhone'],
    },
    {
      name: 'dari',
      displayName: 'Dari / Sanjay / Mahima',
      color: '#10b981',
      lines: ['Sanjay', 'Dari iPhone', 'Dari', 'Dari 2nd iPhone', 'Dari SO iPhone', 'Dari SO',
              'NewLine', '701-412-4006'],
    },
    {
      name: 'bajpayee',
      displayName: 'Bajpayee',
      color: '#f59e0b',
      lines: ['Bajpayee', 'Bajpayee Extra', 'Sapana iPhone', 'Sapana', 'Bajpayee iPhone', 'Manoj'],
    },
    {
      name: 'mainali',
      displayName: 'Mainali (Saroj)',
      color: '#8b5cf6',
      lines: ['Saroj', 'Saroj iPhone', 'Mainali iPhone'],
    },
    {
      name: 'bikas',
      displayName: 'Bikas (Damna)',
      color: '#06b6d4',
      lines: ['Bikas', 'Bikas Razr', 'Bikas iPhone'],
    },
    {
      name: 'ritesh',
      displayName: 'Ritesh',
      color: '#ef4444',
      lines: ['Ritesh', 'Ritesh Roaming'],
    },
    {
      name: 'chiranjiwi',
      displayName: 'Chiranjiwi',
      color: '#ec4899',
      lines: ['Chiranjiwi', 'Chiranjiwi Extra', 'Mama iPhone'],
    },
  ],

  // ── iPhone trade-in credits (from Monthly Bill Targets table) ─────────────
  // Each group got their own trade-in credit from T-Mobile, 24 months (Jul 2024 – Jun 2026).
  // Amounts: Bajpayee $1,200 · Dari $1,000 · Mainali $830 · Saket $1,000
  // Ratio column (7:5:4:5) in the table shows relative shares, not line counts.
  //
  // ── Sapana line billing correction (T-Mobile error, 24 months) ─────────────
  // Sapana's line should cost $50/mo gross, with $12.50 T-Mobile credit → net $37.50 to Bajpayee.
  // Due to a T-Mobile billing error, Sapana's line shows only credits (no charge), while
  // $37.50 of credits that belonged to Saket/Dari/Bajpayee/Mainali were misapplied there.
  // Fix: charge Bajpayee $37.50/mo AND distribute the $37.50 back by ratio 7:5:4:5 (total 21):
  //   Bajpayee (7/21): +$12.50 credit  →  net for Bajpayee: −$37.50 + $12.50 = −$25.00/mo
  //   Saket    (5/21): +$8.93 credit
  //   Dari     (5/21): +$8.93 credit
  //   Mainali  (4/21): +$7.14 credit
  //   Total credits = $12.50 + $8.93 + $8.93 + $7.14 = $37.50 ✓
  creditConfigs: [
    // ── iPhone trade-in credits ──
    {
      accountGroup: 'saket',
      description: 'Saket iPhone trade-in credit (24 mo)',
      totalCredit: 1000,
      monthlyCredit: 41.67,
      startDate: '2024-07',
      endDate: '2026-06',
      appliedTo: ['Saket'],
    },
    {
      accountGroup: 'dari',
      description: 'Dari/Sanjay iPhone trade-in credit (24 mo)',
      totalCredit: 1000,
      monthlyCredit: 41.67,
      startDate: '2024-07',
      endDate: '2026-06',
      appliedTo: ['Sanjay', 'Dari iPhone'],
    },
    {
      accountGroup: 'bajpayee',
      description: 'Bajpayee iPhone trade-in credit (24 mo)',
      totalCredit: 1200,
      monthlyCredit: 50.00,
      startDate: '2024-07',
      endDate: '2026-06',
      appliedTo: ['Bajpayee iPhone'],
    },
    {
      accountGroup: 'mainali',
      description: 'Mainali iPhone trade-in credit (24 mo)',
      totalCredit: 830,
      monthlyCredit: 34.58,
      startDate: '2024-07',
      endDate: '2026-06',
      appliedTo: ['Mainali iPhone'],
    },
    {
      accountGroup: 'bikas',
      description: 'Bikas iPhone trade-in credit (24 mo)',
      totalCredit: 315,
      monthlyCredit: 13.13,
      startDate: '2024-07',
      endDate: '2026-06',
      appliedTo: ['Bikas iPhone'],
    },
    // ── Sapana line billing correction (T-Mobile error, Jan 2024 – Dec 2025) ──
    {
      accountGroup: 'bajpayee',
      description: 'Sapana line charge — T-Mobile billing correction (−$37.50/mo net cost)',
      totalCredit: -900,          // −$37.50 × 24 months
      monthlyCredit: -37.50,      // negative = extra charge to Bajpayee
      startDate: '2024-01',
      endDate: '2025-12',
      appliedTo: ['Sapana iPhone'],
    },
    {
      accountGroup: 'bajpayee',
      description: 'Sapana credit — Bajpayee share (7/21 × $37.50 = $12.50/mo)',
      totalCredit: 300,           // $12.50 × 24 months
      monthlyCredit: 12.50,
      startDate: '2024-01',
      endDate: '2025-12',
      appliedTo: ['Sapana iPhone'],
    },
    {
      accountGroup: 'saket',
      description: 'Sapana credit — Saket share (5/21 × $37.50 = $8.93/mo)',
      totalCredit: 214.29,        // $8.93 × 24 months
      monthlyCredit: 8.93,
      startDate: '2024-01',
      endDate: '2025-12',
      appliedTo: ['Sapana iPhone'],
    },
    {
      accountGroup: 'dari',
      description: 'Sapana credit — Dari share (5/21 × $37.50 = $8.93/mo)',
      totalCredit: 214.29,
      monthlyCredit: 8.93,
      startDate: '2024-01',
      endDate: '2025-12',
      appliedTo: ['Sapana iPhone'],
    },
    {
      accountGroup: 'mainali',
      description: 'Sapana credit — Mainali share (4/21 × $37.50 = $7.14/mo)',
      totalCredit: 171.43,        // $7.14 × 24 months
      monthlyCredit: 7.14,
      startDate: '2024-01',
      endDate: '2025-12',
      appliedTo: ['Sapana iPhone'],
    },
  ],

  lineOwnership: {
    // Saket's group – includes Home Internet router
    'Saket': 'saket',
    'Saket iPhone': 'saket',
    'Dadha Router': 'saket',
    'Home Internet': 'saket',
    // Dari / Sanjay / Mahima
    'Sanjay': 'dari',
    'Dari iPhone': 'dari',
    'Dari': 'dari',
    'Dari 2nd iPhone': 'dari',
    'Dari SO iPhone': 'dari',
    'Dari SO': 'dari',
    'NewLine': 'dari',
    '701-412-4006': 'dari',
    // Bajpayee family
    'Bajpayee': 'bajpayee',
    'Bajpayee Extra': 'bajpayee',
    'Sapana iPhone': 'bajpayee',
    'Sapana': 'bajpayee',
    'Bajpayee iPhone': 'bajpayee',
    // Mainali = Saroj's family
    'Saroj': 'mainali',
    'Saroj iPhone': 'mainali',
    'Mainali iPhone': 'mainali',   // Saroj's phone
    // Bikas (Damna) – separate paying group
    'Bikas': 'bikas',
    'Bikas Razr': 'bikas',
    'Bikas iPhone': 'bikas',
    // Ritesh – separate paying group
    'Ritesh': 'ritesh',
    'Ritesh Roaming': 'ritesh',
    // Chiranjiwi – Mama iPhone belongs to Chiranjiwi
    'Chiranjiwi': 'chiranjiwi',
    'Chiranjiwi Extra': 'chiranjiwi',
    'Mama iPhone': 'chiranjiwi',
    // Dada iPhone = Saket (Me)
    'Dada iPhone': 'saket',
    // Manoj = Bajpayee
    'Manoj': 'bajpayee',
  },
};
