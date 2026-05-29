# Session Handoff — mobile-bill-calculator

## Branch
`claude/mobile-header-credits-icon-y6d8B`

## What was done this session

### 1. Mobile header fix
- Top nav now stacks on mobile: logo row + full-width tab bar below it
- Desktop keeps the single-row inline nav
- File: `src/components/App.tsx`

### 2. GitHub Gist persistence
- New `src/lib/gistStorage.ts` — reads/writes a `records.json` Gist
- New `src/components/PinDialog.tsx` — PIN entry modal
- Save to Gist requires PAT (embedded at build time) + shared PIN entered by user
- "☁ Sync" button in BillResults (only shown when bill is verified and Gist is enabled)
- "Migrate All History to Gist" button in Credits tab (one-time bulk write)
- `deploy.yml` updated to inject `PUBLIC_GIST_ID`, `PUBLIC_GITHUB_PAT`, `PUBLIC_SAVE_PIN` from GitHub Actions secrets
- Files: `src/components/BillResults.tsx`, `src/components/App.tsx`, `.github/workflows/deploy.yml`

### 3. Tap-to-expand cost breakdown on person cards
- Each person card in Dashboard is now clickable
- Expands inline ledger: Line Charges / Shared Costs / Credits / Carried Balance / Total / Paid / Remaining
- For Bajpayee: negative credits renders as "Billing Adj. (Sapana) +$25.00" (amber)
- File: `src/components/Dashboard.tsx`

### 4. Bajpayee/Sapana math audit — confirmed correct
- 7:5:4:5 ratio in config.ts is applied correctly in calculator.ts
- BalanceSection (left-to-pay) also uses getPersonTotal which includes the correction
- No code changes needed

### 5. NewLine / 701-412-4006 ownership correction
- `NewLine` → `saket` group (temporary line on Saket's account)
- `701-412-4006` → `dari` group (Mahima's permanent number)
- historyData.ts: 5 months (Jan–May 2026) updated — dari shows ["Sanjay", "701-412-4006"] with original combined charges; saket back to original amounts
- File: `src/lib/config.ts`, `src/lib/historyData.ts`

---

## Open question — Mainali monthly cost verification

### User's expected formula
```
$45–46   line charges (Saroj's plan)
+ $14    shared cost share (proportion of internet/streaming)
− $7     credit
≈ $52–53 total
```

### What config.ts has for Mainali
| Credit | Monthly | Active Period |
|--------|---------|---------------|
| iPhone trade-in (Mainali iPhone) | $34.58/mo | Jul 2024 – Jun 2026 |
| Sapana correction (4/21 ratio)   | $7.10/mo  | Jan 2024 – Dec 2025 (ENDED) |

### The problem
The user's formula only captures the $7 Sapana correction. The larger $34.58 trade-in credit is not mentioned. For Jan–May 2026 the correct formula should be:
```
$45–46  line charges
+ $14   shared cost share
− $34.58 trade-in  (still active through Jun 2026)
− $0    Sapana correction (ended Dec 2025)
≈ $24–25 total
```

BUT historyData.ts for Jan–May 2026 shows Mainali at **$59.43 with credits: 0**.

This $59.43 ≈ $45 line + $14 shared, with NO credit deducted.

### What to check in the PDF / Excel
1. On the T-Mobile PDF for any month Jul 2024 – Jun 2026:
   - Find Saroj/Mainali iPhone's line section
   - Note the gross plan cost (before any credits)
   - Note the credit line for the trade-in (should appear as a separate line item, e.g. "iPhone trade-in credit −$34.58")
   - Note whether the credit shows up on the bill itself or is only tracked via config

2. In the Excel sheet:
   - Find the "Monthly Bill Targets" or similar table
   - Check what amount is listed for Mainali/Saroj per month
   - Is it the gross or net-of-credit figure?

3. The key question: **was the $34.58 trade-in credit already reflected in the T-Mobile PDF line charges (meaning the PDF shows net amounts), or does the PDF show gross charges with a separate credit line?**
   - If T-Mobile shows it as a separate credit line → parser picks it up as `lineCredits`, and config's $34.58 promoCredit would DOUBLE-COUNT it
   - If T-Mobile bakes it into the plan price shown → config's $34.58 promoCredit is the only place it's applied, and the historyData entries with credits: 0 are wrong for those months

### Likely fix (to confirm after seeing PDFs)
If the trade-in appears as a **separate credit line on the PDF** (most likely for T-Mobile):
- The parser captures it as `lineCredits` automatically
- The config `promoCredit` of $34.58 would then be double-counting
- historyData entries with credits: 0 might actually be correct IF the person entered the net amount after credits

If the trade-in is **not on the PDF** (handled only via config):
- historyData for Jan–May 2026 is missing ~$34.58/month for Mainali
- Those 5 months likely overcharged Mainali by ~$34.58 each (~$172.90 total)

---

## Calculator formula (src/lib/calculator.ts line 67)
```typescript
subtotal = lineCharges + sharedShare - lineCredits - promoCredit + previousDue
```
- `lineCredits` = credits extracted from the PDF per line
- `promoCredit` = date-filtered credits from config.ts creditConfigs
- These are SEPARATE and both get subtracted — if the trade-in appears in both, it double-counts

## Key files
- `src/lib/calculator.ts` — core formula
- `src/lib/config.ts` — creditConfigs (trade-in amounts and date ranges)
- `src/lib/historyData.ts` — hardcoded history (manually entered, not run through calculator)
- `src/lib/parser.ts` — PDF text extraction and credit line parsing
- `src/components/Dashboard.tsx` — PersonCard with tap-to-expand breakdown
