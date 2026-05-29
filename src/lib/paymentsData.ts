/**
 * Total payments extracted from T-Mobile.xlsx "Paid" rows.
 * These represent actual cash transfers made to the bill payer (Saket, then Sanjay from Jul 2025).
 * Sourced from every "Paid" row across all month sheets (January–December, all year blocks).
 */
export const TOTAL_PAID: Record<string, number> = {
  saket:      3499.60,
  dari:       3233.87,
  bajpayee:   1582.39,
  mainali:    1032.30,
  bikas:      1071.80,
  ritesh:      780.00,
  chiranjiwi: 2000.00,
};
