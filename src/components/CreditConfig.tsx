import type { AppConfig } from '../lib/types';

interface Props {
  config: AppConfig;
}

// iPhone trade-in credits — separate per group, 24 months Jul 2024–Jun 2026
const IPHONE_CREDITS = [
  { account: 'Bajpayee',   totalCredit: 1200, monthlyCredit: 50.00, months: 24 },
  { account: 'Dari',       totalCredit: 1000, monthlyCredit: 41.67, months: 24 },
  { account: 'Mainali',    totalCredit:  830, monthlyCredit: 34.58, months: 24 },
  { account: 'Saket (Me)', totalCredit: 1000, monthlyCredit: 41.67, months: 24 },
  { account: 'Bikas',      totalCredit:  315, monthlyCredit: 13.13, months: 24 },
];

// Sapana billing correction — charge Bajpayee $37.50/mo, then distribute back by ratio 7:5:4:5
const SAPANA_TABLE = [
  { account: 'Bajpayee',   monthlyTarget: 300, ratio: 7, creditPerMo: 12.50, months: 24 },
  { account: 'Dari',       monthlyTarget: 240, ratio: 5, creditPerMo:  8.95, months: 24 },
  { account: 'Mainali',    monthlyTarget: 140, ratio: 4, creditPerMo:  7.10, months: 24 },
  { account: 'Saket (Me)', monthlyTarget: 240, ratio: 5, creditPerMo:  8.95, months: 24 },
];

export default function CreditConfig({ config }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Credits & Billing Corrections</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Two separate adjustments: iPhone trade-in credits (per group) and Sapana line T-Mobile billing error.
          </p>
        </div>

        <div className="p-6 space-y-6">

          {/* ── Section 1: iPhone Trade-In Credits ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              1 · iPhone Trade-In Credits
              <span className="ml-2 text-xs font-normal text-gray-400">Jul 2024 – Jun 2026 · 24 months · per group</span>
            </h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2 text-left   text-gray-500 font-medium text-xs">Account</th>
                    <th className="px-4 py-2 text-right  text-gray-500 font-medium text-xs">Total Credit</th>
                    <th className="px-4 py-2 text-right  text-gray-500 font-medium text-xs">Months</th>
                    <th className="px-4 py-2 text-right  text-gray-500 font-medium text-xs">Credit / mo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {IPHONE_CREDITS.map((row) => (
                    <tr key={row.account}>
                      <td className="px-4 py-2 font-medium">{row.account}</td>
                      <td className="px-4 py-2 text-right font-mono text-green-600">
                        ${row.totalCredit.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-gray-500">{row.months}</td>
                      <td className="px-4 py-2 text-right font-mono text-emerald-600">
                        ${row.monthlyCredit.toFixed(2)}/mo
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold text-xs text-gray-600">
                    <td className="px-4 py-2">Total</td>
                    <td className="px-4 py-2 text-right font-mono text-green-600">
                      ${IPHONE_CREDITS.reduce((s, r) => s + r.totalCredit, 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-2" />
                    <td className="px-4 py-2 text-right font-mono text-emerald-600">
                      ${IPHONE_CREDITS.reduce((s, r) => s + r.monthlyCredit, 0).toFixed(2)}/mo
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Section 2: Sapana Billing Correction ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              2 · Sapana Line — T-Mobile Billing Error Correction
              <span className="ml-2 text-xs font-normal text-gray-400">Jan 2024 – Dec 2025 · 24 months</span>
            </h3>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              Sapana's line should charge <strong>$50/mo gross</strong> with a <strong>$12.50 T-Mobile credit</strong> → net $37.50 owed to Bajpayee.
              Due to a T-Mobile error, credits meant for other lines were applied to Sapana's line (showing $0 charge).
              Fix: charge Bajpayee <strong>+$37.50/mo</strong>, then distribute that $37.50 back as credits
              by ratio 7:5:4:5 (total 21 parts). Net Bajpayee = −$37.50 + $12.50 = <strong>−$25.00/mo</strong>.
            </p>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2 text-left   text-gray-500 font-medium text-xs">Account</th>
                    <th className="px-4 py-2 text-right  text-gray-500 font-medium text-xs">Monthly ~Target</th>
                    <th className="px-4 py-2 text-right  text-gray-500 font-medium text-xs">Ratio (share)</th>
                    <th className="px-4 py-2 text-right  text-gray-500 font-medium text-xs">Credit / mo</th>
                    <th className="px-4 py-2 text-right  text-gray-500 font-medium text-xs">Total (24 mo)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {SAPANA_TABLE.map((row) => (
                    <tr key={row.account}>
                      <td className="px-4 py-2 font-medium">{row.account}</td>
                      <td className="px-4 py-2 text-right font-mono text-gray-600">~${row.monthlyTarget}</td>
                      <td className="px-4 py-2 text-right font-semibold">{row.ratio}</td>
                      <td className="px-4 py-2 text-right font-mono text-emerald-600">
                        ${row.creditPerMo.toFixed(2)}/mo
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-green-600">
                        ${(row.creditPerMo * row.months).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold text-xs text-gray-600">
                    <td className="px-4 py-2">Total (21 parts)</td>
                    <td className="px-4 py-2 text-right font-mono">
                      ~${SAPANA_TABLE.reduce((s, r) => s + r.monthlyTarget, 0)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {SAPANA_TABLE.reduce((s, r) => s + r.ratio, 0)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-emerald-600">
                      $37.50/mo ✓
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-green-600">
                      ${SAPANA_TABLE.reduce((s, r) => s + r.creditPerMo * r.months, 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="px-4 py-2 bg-amber-50 border-t border-amber-100">
                <p className="text-xs text-amber-700">
                  <strong>Bajpayee net:</strong> charged −$37.50/mo + credited back $12.50/mo (7/21 share) = <strong>−$25.00/mo</strong> extra for 24 months = −$600 total.
                  The remaining $25.00 goes to Saket ($8.95), Dari ($8.95), Mainali ($7.10).
                </p>
              </div>
            </div>
          </div>

          {/* ── Account groups ── */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Account Groups & Lines
            </div>
            <div className="divide-y divide-gray-100">
              {config.accountGroups.map((group) => (
                <div key={group.name} className="px-4 py-3 flex items-start gap-3">
                  <div className="w-3 h-3 rounded-sm mt-0.5" style={{ backgroundColor: group.color }} />
                  <div>
                    <div className="font-medium text-sm text-gray-800">{group.displayName}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Lines: {group.lines.join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function endDate(start: string, months: number): string {
  const [y, m] = start.split('-').map(Number);
  const end = new Date(y, m - 1 + months, 1);
  return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;
}
