export interface LineItem {
  lineId: string;
  lineName: string;
  phoneNumber?: string;
  planCost: number;
  equipmentCost: number;
  creditAmount: number;
  extras: number;
  taxes: number;
  notes?: string;
}

export interface SharedCosts {
  homeInternet: number;
  streaming: number;   // Netflix, YouTube, Apple TV
  basePlan: number;    // shared plan discount
  other: number;
}

/** One itemized row inside the tap-to-expand card breakdown */
export interface PersonShareLineItem {
  /** Display label, e.g. "Sanjay (208-840-1299)" or "Home Internet (863-606-2309)" */
  label: string;
  /** Secondary detail, e.g. "iPhone 16 Pro — $41.67 installment − $20.63 R120 trade = $21.04" */
  sublabel?: string;
  /** Dollar amount for this line */
  amount: number;
  /** Type of charge for color-coding */
  kind: 'plan' | 'equipment' | 'shared' | 'credit' | 'promo_credit' | 'tax';
}

export interface PersonShare {
  name: string;
  accountGroup: string;
  lines: string[];
  lineCharges: number;
  sharedCostShare: number;
  credits: number;
  extras: number;
  previousDue: number;
  total: number;
  paid: number;
  balance: number;
  manualOverride?: number;
  notes?: string;
  /** Optional per-line itemized breakdown for tap-to-expand detail view */
  lineItems?: PersonShareLineItem[];
}

export interface CreditConfig {
  accountGroup: string;
  description: string;
  totalCredit: number;
  monthlyCredit: number;
  startDate: string;  // "YYYY-MM"
  endDate: string;    // "YYYY-MM"
  appliedTo: string[];  // line names
}

export interface AccountGroup {
  name: string;
  displayName: string;
  color: string;
  lines: string[];  // line names that belong to this group
}

export interface ParsedBill {
  month: string;       // "YYYY-MM"
  totalDue: number;
  lineItems: LineItem[];
  sharedCosts: SharedCosts;
  rawText?: string;
}

export interface MonthRecord {
  month: string;
  totalBill: number;
  personShares: PersonShare[];
  verified: boolean;
  verifiedTotal: number;
  notes?: string;
  savedAt: string;
  paidBy?: string;  // 'Saket' | 'Sanjay' — who paid T-Mobile that month
}

export interface Payment {
  id: string;
  date: string;                              // YYYY-MM-DD
  fromGroup: string;                         // accountGroup of the payer
  fromName: string;
  toPayee: 'saket' | 'sanjay';
  amount: number;
  method: 'venmo' | 'zelle' | 'cash' | 'bank' | 'other';
  note?: string;
}

export interface PayClickData {
  accountGroup: string;
  fromName: string;
  balSaket: number;
  balSanjay: number;
}

export interface AppConfig {
  accountGroups: AccountGroup[];
  creditConfigs: CreditConfig[];
  lineOwnership: Record<string, string>;  // lineName -> accountGroup
}
