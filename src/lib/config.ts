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

  // ── iPhone trade-in credits — NOT in creditConfigs (would double-count) ────
  // T-Mobile bills show NET equipment costs (installment minus trade-in already deducted).
  // parser.ts extracts those net amounts directly. Adding creditConfigs here would
  // double-subtract the trade-in and undercharge everyone.
  //
  // Actual credits per PDF analysis (reference only):
  //   Saket  (401-207-7052) iPhone 16 Pro: $20.63/mo R120, May 2025–Apr 2027
  //   Sanjay (208-840-1299) iPhone 16 Pro: $20.63/mo R120, May 2025–Apr 2027
  //   Saroj  (857-264-9862) iPhone 16:     $20.63/mo R116, May 2025–Apr 2027
  //   Manoj  (407-416-5178) iPhone:        $23.96/mo R120, May 2025–Apr 2027
  //   Bikas  (617-955-9929) razr 2024:     $20.84/mo P896, Oct 2024–Sep 2026
  //   Sapana (252-350-3063) iPhone 16:     $12.50/mo P807, Jan 2025–Dec 2026
  //   Mahima (701-412-4006) iPhone 17 Pro: $12.30/mo R451, Jan 2026–Dec 2027
  //
  // ── Sapana line billing correction (T-Mobile error, Jan 2024 – Dec 2025) ────
  // Sapana's line should cost $50/mo gross, with $12.50 T-Mobile credit → net $37.50 to Bajpayee.
  // Due to a T-Mobile billing error, Sapana's line shows only credits (no charge), while
  // $37.50 of credits that belonged to Saket/Dari/Bajpayee/Mainali were misapplied there.
  // Fix: charge Bajpayee $37.50/mo AND distribute the $37.50 back by ratio 7:5:4:5 (total 21):
  //   Bajpayee (7/21): +$12.50 credit  →  net for Bajpayee: −$37.50 + $12.50 = −$25.00/mo
  //   Saket    (5/21): +$8.95 credit
  //   Dari     (5/21): +$8.95 credit
  //   Mainali  (4/21): +$7.10 credit
  //   Total credits = $12.50 + $8.95 + $8.95 + $7.10 = $37.50 ✓
  creditConfigs: [
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
      description: 'Sapana credit — Saket share (5/21 × $37.50 = $8.95/mo)',
      totalCredit: 214.80,        // $8.95 × 24 months
      monthlyCredit: 8.95,
      startDate: '2024-01',
      endDate: '2025-12',
      appliedTo: ['Sapana iPhone'],
    },
    {
      accountGroup: 'dari',
      description: 'Sapana credit — Dari share (5/21 × $37.50 = $8.95/mo)',
      totalCredit: 214.80,        // $8.95 × 24 months
      monthlyCredit: 8.95,
      startDate: '2024-01',
      endDate: '2025-12',
      appliedTo: ['Sapana iPhone'],
    },
    {
      accountGroup: 'mainali',
      description: 'Sapana credit — Mainali share (4/21 × $37.50 = $7.10/mo)',
      totalCredit: 170.40,        // $7.10 × 24 months
      monthlyCredit: 7.10,
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
