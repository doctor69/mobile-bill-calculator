#!/usr/bin/env python3
"""
Generate lineItems for each PersonShare in historyData.ts
using PDF bill data from tmobile_bill_data.json.

For each month + group, this builds a list of PersonShareLineItem objects
explaining the charge breakdown: plan shares, equipment installments, account share.

Usage:
    python3 scripts/generate_lineitems.py

Output:
    Prints TypeScript snippet and writes src/data/lineitems_by_month.json
"""

import json
from pathlib import Path

# ── Group → phone numbers mapping ────────────────────────────────────────────
# (inverse of PHONE_MAP in extract_tmobile_pdfs.py)
GROUP_PHONES = {
    'dari':       ['208-840-1299', '701-412-4006', '701-415-5731'],
    'saket':      ['401-207-7052', '863-449-8681', '863-606-2309'],
    'chiranjiwi': ['401-338-8422'],
    'bikas':      ['617-955-9929'],
    'ritesh':     ['857-205-9815'],
    'mainali':    ['857-264-9862'],
    'bajpayee':   ['407-416-5178', '252-350-3063'],
}

PHONE_LABELS = {
    '208-840-1299': 'Sanjay',
    '401-207-7052': 'Saket',
    '401-338-8422': 'Chiranjiwi',
    '617-955-9929': 'Bikas',
    '857-205-9815': 'Ritesh',
    '857-264-9862': 'Saroj',
    '407-416-5178': 'Manoj (Bajpayee)',
    '252-350-3063': 'Sapana',
    '701-412-4006': 'Mahima',
    '701-415-5731': 'Dari',
    '863-449-8681': 'Home Internet',
    '863-606-2309': 'Home Internet',
}


def format_phone(phone):
    """208-840-1299 → (208) 840-1299"""
    parts = phone.split('-')
    if len(parts) == 3:
        return f'({parts[0]}) {parts[1]}-{parts[2]}'
    return phone


def make_equipment_sublabel(eq):
    """Build a human-readable sublabel for an equipment installment."""
    device = eq.get('device', '')
    # Truncate long device names
    if len(device) > 40:
        device = device[:38] + '…'
    inst = eq.get('installment_num')
    inst_of = eq.get('installment_of')
    gross = eq.get('gross')
    promo = eq.get('promo_credit')
    parts = []
    if inst and inst_of:
        parts.append(f'installment {inst}/{inst_of}')
    if gross and promo and promo > 0:
        parts.append(f'${gross:.2f} − ${promo:.2f} promo = ${gross - promo:.2f}')
    elif gross:
        parts.append(f'${gross:.2f}/mo')
    return ', '.join(parts) if parts else None


def generate_lineitems_for_month(month_data, group, hist_line_charges):
    """
    Generate lineItems for one group in one month.

    Returns list of dicts matching PersonShareLineItem interface.
    """
    lines = month_data.get('lines', {})
    account = month_data.get('account_line', {})

    # Find phones that belong to this group and appear in the bill
    group_phones = GROUP_PHONES.get(group, [])
    present_phones = {ph: lines[ph] for ph in group_phones if ph in lines}

    if not present_phones:
        return []

    items = []
    phone_totals_sum = 0.0

    for phone, line_data in present_phones.items():
        phone_label = PHONE_LABELS.get(phone, phone)
        display_phone = format_phone(phone)
        line_total = line_data.get('total', 0.0)
        plans = line_data.get('plans', 0.0)
        equipment = line_data.get('equipment', 0.0)
        included = line_data.get('included_in_plan', False)
        eq_details = line_data.get('equipment_detail', [])

        phone_totals_sum += line_total

        # Plan cost (if standalone add-on line with own plan cost)
        if plans > 0 and not included:
            items.append({
                'label': f'{phone_label} — plan ({display_phone})',
                'amount': round(plans, 2),
                'kind': 'plan',
            })

        # Equipment (net installment)
        if equipment != 0:
            # Find the relevant equipment_detail (skip lines that are just the bill summary row)
            device_items = [e for e in eq_details
                           if e.get('installment_num') or (e.get('gross') and e.get('gross') > 0)]
            if device_items:
                for eq in device_items:
                    device = eq.get('device', 'Device')
                    if len(device) > 40:
                        device = device[:38] + '…'
                    sublabel = make_equipment_sublabel(eq)
                    items.append({
                        'label': f'{phone_label} — {device}',
                        'sublabel': sublabel,
                        'amount': round(eq.get('net', equipment), 2),
                        'kind': 'equipment',
                    })
            else:
                # No device detail — just show as equipment
                if equipment < 0:
                    # Promo credit (like Sapana -$12.50)
                    items.append({
                        'label': f'{phone_label} — device promo credit',
                        'amount': round(abs(equipment), 2),
                        'kind': 'promo_credit',
                    })
                else:
                    items.append({
                        'label': f'{phone_label} — device installment ({display_phone})',
                        'amount': round(equipment, 2),
                        'kind': 'equipment',
                    })

        # Line-level taxes/fees (the $5.51/$4.98 plan portion in Experience Beyond era is actually taxes)
        # In older bills, included_in_plan=True means plan=0 but equipment is separate

    # Account plan share = remainder after phone-line totals
    account_share = round(hist_line_charges - phone_totals_sum, 2)

    if account_share > 0.50:  # Only show if meaningful
        account_total = account.get('total', 0.0) or account.get('plans', 0.0)
        # Determine plan name from period
        if account_total > 0:
            items.append({
                'label': 'Base plan share (account)',
                'sublabel': f'${account_total:.2f} account line / all groups',
                'amount': round(account_share, 2),
                'kind': 'plan',
            })
        else:
            items.append({
                'label': 'Base plan share',
                'amount': round(account_share, 2),
                'kind': 'plan',
            })

    return items


def main():
    # Load PDF bill data
    bill_data_path = Path('src/data/tmobile_bill_data.json')
    with open(bill_data_path) as f:
        bill_data = json.load(f)

    # Output: month → group → lineItems
    result = {}

    for month, month_data in sorted(bill_data.items()):
        total_due = month_data.get('total_due', 0.0)
        lines = month_data.get('lines', {})

        # Skip months with no usable data (old format, no phone lines extracted)
        phone_lines = {k: v for k, v in lines.items() if not k.startswith('_') and k != 'account'}
        if not phone_lines:
            continue

        # For each group, generate lineItems
        # We need hist_line_charges but don't have it here — will fill in 0 as placeholder
        # The caller will need to pass actual lineCharges for each group
        month_result = {}

        for group, phones in GROUP_PHONES.items():
            present = [ph for ph in phones if ph in phone_lines]
            if not present:
                continue

            # Sum of phone line totals for this group
            phone_sum = sum(phone_lines[ph].get('total', 0.0) for ph in present)

            # Generate items without account_share (will be filled later from historyData)
            phone_items = []
            for phone in present:
                line_data = phone_lines[phone]
                phone_label = PHONE_LABELS.get(phone, phone)
                display_phone = format_phone(phone)
                plans = line_data.get('plans', 0.0)
                equipment = line_data.get('equipment', 0.0)
                included = line_data.get('included_in_plan', False)
                eq_details = line_data.get('equipment_detail', [])

                # Standalone plan cost
                if plans > 0 and not included:
                    phone_items.append({
                        'label': f'{phone_label} — plan',
                        'amount': round(plans, 2),
                        'kind': 'plan',
                    })

                # Equipment
                if equipment > 0:
                    device_items = [e for e in eq_details if e.get('installment_num')]
                    if device_items:
                        for eq in device_items:
                            device = eq.get('device', 'Device')
                            if len(device) > 40:
                                device = device[:38] + '…'
                            sublabel = make_equipment_sublabel(eq)
                            phone_items.append({
                                'label': f'{phone_label} — {device}',
                                'sublabel': sublabel,
                                'amount': round(eq.get('net', equipment), 2),
                                'kind': 'equipment',
                            })
                    else:
                        phone_items.append({
                            'label': f'{phone_label} — device installment',
                            'amount': round(equipment, 2),
                            'kind': 'equipment',
                        })
                elif equipment < 0:
                    # Promo credit (e.g., Sapana -$12.50)
                    phone_items.append({
                        'label': f'{phone_label} — promo credit',
                        'amount': round(abs(equipment), 2),
                        'kind': 'promo_credit',
                    })

            if phone_items:
                month_result[group] = {
                    'items': phone_items,
                    'phone_sum': round(phone_sum, 2),
                    # account_share will be computed later from historyData.lineCharges - phone_sum
                }

        if month_result:
            result[month] = month_result

    # Write output
    out_path = Path('src/data/lineitems_by_month.json')
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, 'w') as f:
        json.dump(result, f, indent=2)

    print(f'Generated lineItems for {len(result)} months → {out_path}')
    # Stats
    for month in sorted(result.keys())[-10:]:
        groups = list(result[month].keys())
        print(f'  {month}: {len(groups)} groups: {", ".join(groups)}')


if __name__ == '__main__':
    main()
