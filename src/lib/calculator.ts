import type { ParsedBill, PersonShare, AccountGroup, AppConfig } from './types';
import { DEFAULT_CONFIG } from './config';

export function calculateBillSplit(
  bill: ParsedBill,
  config: AppConfig = DEFAULT_CONFIG,
  previousBalances: Record<string, number> = {}
): PersonShare[] {
  const { accountGroups, lineOwnership, creditConfigs } = config;
  const month = bill.month;

  // Calculate active credits for this month
  const activeCredits: Record<string, number> = {};
  for (const credit of creditConfigs) {
    if (month >= credit.startDate && month <= credit.endDate) {
      const current = activeCredits[credit.accountGroup] ?? 0;
      activeCredits[credit.accountGroup] = current + credit.monthlyCredit;
    }
  }

  // Group lines by account
  const accountLines: Record<string, typeof bill.lineItems> = {};
  const unassignedLines: typeof bill.lineItems = [];
  const sharedGroups = new Set<string>();

  for (const line of bill.lineItems) {
    const group = lineOwnership[line.lineName] ?? lineOwnership[line.lineId];
    if (!group || group === 'shared') {
      unassignedLines.push(line);
      continue;
    }
    if (!accountLines[group]) accountLines[group] = [];
    accountLines[group].push(line);
  }

  // Calculate total number of lines for shared cost distribution
  const totalLines = bill.lineItems.length || 1;
  const sharedCostTotal =
    bill.sharedCosts.homeInternet +
    bill.sharedCosts.streaming +
    bill.sharedCosts.basePlan +
    bill.sharedCosts.other;

  // Build per-person shares
  const shares: PersonShare[] = [];

  for (const group of accountGroups) {
    const lines = accountLines[group.name] ?? [];
    const lineCount = lines.length;

    const lineCharges = lines.reduce(
      (sum, l) => sum + l.planCost + l.equipmentCost + l.extras + l.taxes,
      0
    );
    const lineCredits = lines.reduce((sum, l) => sum + l.creditAmount, 0);

    // Proportional share of account-level shared costs
    const sharedShare = totalLines > 0
      ? (lineCount / totalLines) * sharedCostTotal
      : 0;

    // Additional credits from promotion config
    const promoCredit = activeCredits[group.name] ?? 0;

    const previousDue = previousBalances[group.name] ?? 0;

    const subtotal = lineCharges + sharedShare - lineCredits - promoCredit + previousDue;
    const total = Math.max(0, subtotal); // floor at 0 for display; balance tracks overpay

    const balance = subtotal; // positive = owes, negative = credit

    shares.push({
      name: group.displayName,
      accountGroup: group.name,
      lines: lines.map((l) => l.lineName || l.lineId),
      lineCharges: round2(lineCharges),
      sharedCostShare: round2(sharedShare),
      credits: round2(lineCredits + promoCredit),
      extras: 0,
      previousDue: round2(previousDue),
      total: round2(balance),
      paid: 0,
      balance: round2(balance),
    });
  }

  return shares;
}

export function verifyTotal(shares: PersonShare[], expectedTotal: number): boolean {
  const sum = shares.reduce((s, p) => s + (p.manualOverride ?? p.lineCharges + p.sharedCostShare - p.credits + p.previousDue), 0);
  return Math.abs(sum - expectedTotal) < 0.02;
}

export function getVerificationDiff(shares: PersonShare[], expectedTotal: number): number {
  const sum = shares.reduce((s, p) => s + getPersonTotal(p), 0);
  return round2(sum - expectedTotal);
}

export function getPersonTotal(p: PersonShare): number {
  if (p.manualOverride !== undefined) return p.manualOverride;
  return round2(p.lineCharges + p.sharedCostShare - p.credits + p.previousDue);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
