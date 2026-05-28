import type { AppConfig } from './types';

export const DEFAULT_CONFIG: AppConfig = {
  accountGroups: [
    {
      name: 'saket',
      displayName: 'Saket (Me)',
      color: '#3b82f6',
      lines: ['Saket', 'Saket iPhone'],
    },
    {
      name: 'dari',
      displayName: 'Dari / Sanjay',
      color: '#10b981',
      lines: ['Sanjay', 'Dari iPhone', 'Dari', 'Dari 2nd iPhone', 'Dari SO iPhone', 'Dari SO'],
    },
    {
      name: 'bajpayee',
      displayName: 'Bajpayee',
      color: '#f59e0b',
      lines: ['Bajpayee', 'Bajpayee Extra', 'Sapana iPhone', 'Sapana', 'Bajpayee iPhone'],
    },
    {
      name: 'mainali',
      displayName: 'Mainali',
      color: '#8b5cf6',
      lines: ['Bikas', 'Bikas Razr', 'Bikas iPhone', 'Manoj', 'Mainali iPhone'],
    },
    {
      name: 'saroj',
      displayName: 'Saroj / Ritesh',
      color: '#ef4444',
      lines: ['Saroj', 'Ritesh', 'Saroj iPhone', 'Ritesh Roaming', 'Mama iPhone', 'Dada iPhone'],
    },
    {
      name: 'chiranjiwi',
      displayName: 'Chiranjiwi',
      color: '#ec4899',
      lines: ['Chiranjiwi', 'Dadha Router', 'Chiranjiwi Extra'],
    },
  ],

  // Credits from iPhone 16 Pro / iPhone 16 promotions
  // Sapana phone: $50/month with $12.5 credit = net $37.5
  // iPhone 16 Pro (Saket/Dari): 830 credit over 36 months = ~$23.06/month per phone
  // iPhone 16 Pro (Bajpayee): 830 credit over 36 months = ~$23.06/month
  // iPhone 16 (Mainali): 630 credit over 36 months = ~$17.50/month
  creditConfigs: [
    {
      accountGroup: 'saket',
      description: 'Saket iPhone 16 Pro trade-in credit',
      totalCredit: 830,
      monthlyCredit: 23.06,
      startDate: '2024-07',
      endDate: '2027-06',
      appliedTo: ['Saket'],
    },
    {
      accountGroup: 'dari',
      description: 'Sanjay iPhone 16 Pro trade-in credit',
      totalCredit: 830,
      monthlyCredit: 23.06,
      startDate: '2024-07',
      endDate: '2027-06',
      appliedTo: ['Sanjay', 'Dari iPhone'],
    },
    {
      accountGroup: 'bajpayee',
      description: 'Bajpayee iPhone 16 Pro trade-in credit',
      totalCredit: 830,
      monthlyCredit: 23.06,
      startDate: '2024-07',
      endDate: '2027-06',
      appliedTo: ['Bajpayee iPhone'],
    },
    {
      accountGroup: 'bajpayee',
      description: 'Sapana iPhone credit (part of Bajpayee account)',
      totalCredit: 0,
      monthlyCredit: 12.5,
      startDate: '2024-01',
      endDate: '2099-12',
      appliedTo: ['Sapana iPhone'],
    },
    {
      accountGroup: 'mainali',
      description: 'Mainali iPhone 16 trade-in credit',
      totalCredit: 630,
      monthlyCredit: 17.50,
      startDate: '2024-07',
      endDate: '2027-06',
      appliedTo: ['Mainali iPhone', 'Bikas iPhone'],
    },
  ],

  lineOwnership: {
    'Saket': 'saket',
    'Saket iPhone': 'saket',
    'Sanjay': 'dari',
    'Dari iPhone': 'dari',
    'Dari': 'dari',
    'Dari 2nd iPhone': 'dari',
    'Dari SO iPhone': 'dari',
    'Bajpayee': 'bajpayee',
    'Bajpayee Extra': 'bajpayee',
    'Sapana iPhone': 'bajpayee',
    'Bajpayee iPhone': 'bajpayee',
    'Bikas': 'mainali',
    'Bikas Razr': 'mainali',
    'Bikas iPhone': 'mainali',
    'Manoj': 'mainali',
    'Mainali iPhone': 'mainali',
    'Saroj': 'saroj',
    'Ritesh': 'saroj',
    'Saroj iPhone': 'saroj',
    'Mama iPhone': 'saroj',
    'Dada iPhone': 'saroj',
    'Ritesh Roaming': 'saroj',
    'Chiranjiwi': 'chiranjiwi',
    'Dadha Router': 'chiranjiwi',
    'Chiranjiwi Extra': 'chiranjiwi',
    'Home Internet': 'shared',
  },
};
