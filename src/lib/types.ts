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
}

export interface AppConfig {
  accountGroups: AccountGroup[];
  creditConfigs: CreditConfig[];
  lineOwnership: Record<string, string>;  // lineName -> accountGroup
}
