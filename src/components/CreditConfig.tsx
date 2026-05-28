import { useState } from 'react';
import type { AppConfig, CreditConfig as CreditConfigType } from '../lib/types';

interface Props {
  config: AppConfig;
}

export default function CreditConfig({ config }: Props) {
  return (
    <div className="space-y-6">
      {/* Credit explanation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">iPhone Trade-In Credits & Account Setup</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configured from the T-Mobile.xlsx calculations
          </p>
        </div>
        <div className="p-6 space-y-4">
          {/* Credit summary boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CreditBox
              title="Dari / Me (Saket)"
              color="blue"
              items={[
                { label: 'Saket iPhone 16 Pro credit', total: 830, monthly: 23.06, start: '2024-07' },
                { label: 'Sanjay iPhone 16 Pro credit', total: 830, monthly: 23.06, start: '2024-07' },
              ]}
            />
            <CreditBox
              title="Bajpayee"
              color="amber"
              items={[
                { label: 'Bajpayee iPhone 16 Pro credit', total: 830, monthly: 23.06, start: '2024-07' },
                { label: 'Sapana iPhone monthly credit', total: 0, monthly: 12.50, start: '2024-01', ongoing: true },
              ]}
            />
            <CreditBox
              title="Mainali"
              color="violet"
              items={[
                { label: 'Mainali iPhone 16 credit', total: 630, monthly: 17.50, start: '2024-07' },
              ]}
            />
          </div>

          {/* The credit mapping issue */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-800 text-sm flex items-center gap-2">
              <span>⚠</span> Credit Mapping Issue (Apr/Jul 2024 onwards)
            </h3>
            <div className="mt-2 text-sm text-amber-700 space-y-1">
              <p>From April–July 2024, credits were applied to wrong accounts in the original Excel:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                <li><strong>Sapana iPhone credit ($12.50/mo)</strong> was credited to Bajpayee's line but should reduce Bajpayee's net phone cost (Sapana: $50 - $12.50 = $37.50 net)</li>
                <li><strong>iPhone 16 Pro trade-in credits</strong> for Dari/Me and Bajpayee were applied to wrong lines</li>
                <li>The correct mapping is now reflected in the account breakdown above</li>
              </ul>
            </div>
          </div>

          {/* Account structure */}
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

          {/* Credit correction summary from user's data */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Monthly Bill Targets (from Excel)
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-2 text-left text-gray-500 font-medium text-xs">Account</th>
                  <th className="px-4 py-2 text-right text-gray-500 font-medium text-xs">Monthly ~Target</th>
                  <th className="px-4 py-2 text-right text-gray-500 font-medium text-xs">Total Credit</th>
                  <th className="px-4 py-2 text-right text-gray-500 font-medium text-xs">Lines</th>
                  <th className="px-4 py-2 text-right text-gray-500 font-medium text-xs">$/line</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-2 font-medium">Bajpayee</td>
                  <td className="px-4 py-2 text-right font-mono">~$300</td>
                  <td className="px-4 py-2 text-right font-mono text-green-600">$1,200</td>
                  <td className="px-4 py-2 text-right">7</td>
                  <td className="px-4 py-2 text-right font-mono">$12.50</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">Dari / Sanjay</td>
                  <td className="px-4 py-2 text-right font-mono">~$240</td>
                  <td className="px-4 py-2 text-right font-mono text-green-600">$1,000</td>
                  <td className="px-4 py-2 text-right">5</td>
                  <td className="px-4 py-2 text-right font-mono">$8.95</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">Mainali</td>
                  <td className="px-4 py-2 text-right font-mono">~$140</td>
                  <td className="px-4 py-2 text-right font-mono text-green-600">$830</td>
                  <td className="px-4 py-2 text-right">4</td>
                  <td className="px-4 py-2 text-right font-mono">$7.10</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">Saket (Me)</td>
                  <td className="px-4 py-2 text-right font-mono">~$240</td>
                  <td className="px-4 py-2 text-right font-mono text-green-600">$1,000</td>
                  <td className="px-4 py-2 text-right">5</td>
                  <td className="px-4 py-2 text-right font-mono">$8.95</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-400">
            Note: Sapana iPhone: $50/month - $12.50 credit = <strong>$37.50 net</strong> (correctly attributed to Bajpayee account)
          </p>
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
    ongoing?: boolean;
  }>;
}

const COLOR_MAP = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', sub: 'text-blue-600' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', sub: 'text-amber-600' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', sub: 'text-violet-600' },
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
              {item.total > 0 && ` · $${item.total} total over ${Math.round(item.total / item.monthly)} months`}
              {item.ongoing && ' · ongoing'}
              {' · from '}{item.start}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
