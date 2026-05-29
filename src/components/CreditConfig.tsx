import type { AppConfig } from '../lib/types';

interface Props {
  config: AppConfig;
}

// Credits from Sapana's line trade-in distributed by ratio over 24 months
const CREDIT_TABLE = [
  { account: 'Bajpayee',      monthlyTarget: 300, totalCredit: 1200, ratio: 7, months: 24 },
  { account: 'Dari / Sanjay', monthlyTarget: 240, totalCredit: 1000, ratio: 5, months: 24 },
  { account: 'Mainali',       monthlyTarget: 140, totalCredit:  830, ratio: 4, months: 24 },
  { account: 'Saket (Me)',    monthlyTarget: 240, totalCredit: 1000, ratio: 5, months: 24 },
];

export default function CreditConfig({ config }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Trade-In Credits & Account Setup</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Credits from Sapana's line, distributed by ratio over 24 months · from T-Mobile.xlsx
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Credit summary boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CreditBox
              title="Saket (Me)"
              color="blue"
              items={[
                { label: 'Sapana line credit (5/21 share)', total: 1000, monthly: 41.67, start: '2024-07', months: 24 },
              ]}
            />
            <CreditBox
              title="Dari / Sanjay"
              color="emerald"
              items={[
                { label: 'Sapana line credit (5/21 share)', total: 1000, monthly: 41.67, start: '2024-07', months: 24 },
              ]}
            />
            <CreditBox
              title="Bajpayee"
              color="amber"
              items={[
                { label: 'Sapana line credit (7/21 share)', total: 1200, monthly: 50.00, start: '2024-07', months: 24 },
                { label: 'Sapana iPhone net credit (ongoing)', total: 0, monthly: 12.50, start: '2024-01', ongoing: true },
              ]}
            />
            <CreditBox
              title="Mainali (Saroj)"
              color="violet"
              items={[
                { label: 'Sapana line credit (4/21 share)', total: 830, monthly: 34.58, start: '2024-07', months: 24 },
              ]}
            />
          </div>

          {/* Monthly Bill Targets table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Monthly Bill Targets (from Excel)
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-2 text-left   text-gray-500 font-medium text-xs">Account</th>
                  <th className="px-4 py-2 text-right  text-gray-500 font-medium text-xs">Monthly ~Target</th>
                  <th className="px-4 py-2 text-right  text-gray-500 font-medium text-xs">Total Credit</th>
                  <th className="px-4 py-2 text-right  text-gray-500 font-medium text-xs">Ratio (share)</th>
                  <th className="px-4 py-2 text-right  text-gray-500 font-medium text-xs">$ / ratio · mo</th>
                  <th className="px-4 py-2 text-right  text-gray-500 font-medium text-xs">Credit / mo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {CREDIT_TABLE.map((row) => {
                  const perUnit   = row.totalCredit / (row.ratio * row.months);
                  const perMonth  = row.totalCredit / row.months;
                  return (
                    <tr key={row.account}>
                      <td className="px-4 py-2 font-medium">{row.account}</td>
                      <td className="px-4 py-2 text-right font-mono text-gray-600">~${row.monthlyTarget}</td>
                      <td className="px-4 py-2 text-right font-mono text-green-600">
                        ${row.totalCredit.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold">{row.ratio}</td>
                      <td className="px-4 py-2 text-right font-mono text-blue-600">
                        ${perUnit.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-emerald-600">
                        ${perMonth.toFixed(2)}/mo
                      </td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                <tr className="bg-gray-50 font-semibold text-xs text-gray-600">
                  <td className="px-4 py-2">Total (21 parts)</td>
                  <td className="px-4 py-2 text-right font-mono">~${CREDIT_TABLE.reduce((s,r)=>s+r.monthlyTarget,0)}</td>
                  <td className="px-4 py-2 text-right font-mono text-green-600">
                    ${CREDIT_TABLE.reduce((s,r)=>s+r.totalCredit,0).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right">{CREDIT_TABLE.reduce((s,r)=>s+r.ratio,0)}</td>
                  <td className="px-4 py-2" />
                  <td className="px-4 py-2 text-right font-mono text-emerald-600">
                    ${(CREDIT_TABLE.reduce((s,r)=>s+r.totalCredit,0)/24).toFixed(2)}/mo
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                All credits run for <strong>24 months</strong> from Jul 2024 → Jun 2026.
                Ratio = each account's share of the total credit pool from Sapana's line.
                Bikas iPhone credit ($315 / 24 mo = $13.13/mo) is tracked separately.
              </p>
            </div>
          </div>

          {/* Account groups */}
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

interface CreditBoxProps {
  title: string;
  color: 'blue' | 'amber' | 'violet' | 'emerald';
  items: Array<{
    label: string;
    total: number;
    monthly: number;
    start: string;
    months?: number;
    ongoing?: boolean;
  }>;
}

const COLOR_MAP = {
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-800',    sub: 'text-blue-600'    },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   sub: 'text-amber-600'   },
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-800',  sub: 'text-violet-600'  },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', sub: 'text-emerald-600' },
};

function CreditBox({ title, color, items }: CreditBoxProps) {
  const c = COLOR_MAP[color];
  return (
    <div className={`${c.bg} ${c.border} border rounded-lg p-4`}>
      <h3 className={`font-semibold text-sm ${c.text} mb-3`}>{title}</h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="text-xs">
            <div className={`font-medium ${c.text}`}>{item.label}</div>
            <div className={c.sub}>
              ${item.monthly.toFixed(2)}/month
              {item.total > 0 && ` · $${item.total.toLocaleString()} total`}
              {item.months && ` · ${item.months} months`}
              {item.ongoing && ' · ongoing'}
              {' · from '}{item.start}
              {item.months && ` → ${endDate(item.start, item.months)}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function endDate(start: string, months: number): string {
  const [y, m] = start.split('-').map(Number);
  const end = new Date(y, m - 1 + months, 1);
  return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;
}
