#!/usr/bin/env python3
"""
Process a single new T-Mobile PDF bill and update both data files in one step.

Usage:
    python3 scripts/process_new_bill.py ~/Downloads/T-Mobile/DetailedBillJun2026.pdf

What it does:
  1. Extracts per-line data from the PDF
  2. Upserts the month into src/data/tmobile_bill_data.json
  3. Generates lineItems for that month and upserts into src/data/lineitems_by_month.json

After running, commit both JSON files and push so CI deploys with the new line items.
"""

import json
import re
import sys
from pathlib import Path

import pdfplumber

# ── Phone number → person mapping ────────────────────────────────────────────

PHONE_MAP = {
    '208-840-1299': {'name': 'Sanjay',         'group': 'dari',       'label': 'Sanjay'},
    '401-207-7052': {'name': 'Saket',           'group': 'saket',      'label': 'Saket'},
    '401-338-8422': {'name': 'Chiranjiwi',      'group': 'chiranjiwi', 'label': 'Chiranjiwi'},
    '617-955-9929': {'name': 'Bikas',           'group': 'bikas',      'label': 'Bikas'},
    '857-205-9815': {'name': 'Ritesh',          'group': 'ritesh',     'label': 'Ritesh'},
    '857-264-9862': {'name': 'Saroj/Mainali',   'group': 'mainali',    'label': 'Saroj'},
    '407-416-5178': {'name': 'Manoj/Bajpayee',  'group': 'bajpayee',   'label': 'Manoj (Bajpayee)'},
    '252-350-3063': {'name': 'Sapana',          'group': 'bajpayee',   'label': 'Sapana'},
    '701-412-4006': {'name': 'Mahima',          'group': 'dari',       'label': 'Mahima'},
    '701-415-5731': {'name': 'Dari-old',        'group': 'dari',       'label': 'Dari'},
    '863-449-8681': {'name': 'Home Internet',   'group': 'saket',      'label': 'Home Internet'},
    '863-606-2309': {'name': 'Home Internet',   'group': 'saket',      'label': 'Home Internet'},
}

# Group → phone numbers (for lineitems generation)
GROUP_PHONES = {}
for ph, info in PHONE_MAP.items():
    GROUP_PHONES.setdefault(info['group'], []).append(ph)

MONTH_NAMES = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
    'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12',
    'January': '01', 'February': '02', 'March': '03', 'April': '04', 'June': '06',
    'July': '07', 'August': '08', 'September': '09', 'October': '10',
    'November': '11', 'December': '12',
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def parse_amount(s):
    if not s or str(s).strip() in ('-', '—', ''):
        return 0.0
    s = str(s).strip().replace('$', '').replace(',', '')
    try:
        return float(s)
    except ValueError:
        return 0.0


def pdf_filename_to_month(fname):
    m = re.match(r'DetailedBill(\w+?)(\d{4})\.pdf', Path(fname).name)
    if not m:
        return None
    mon_num = MONTH_NAMES.get(m.group(1))
    return f'{m.group(2)}-{mon_num}' if mon_num else None


def extract_all_text(pdf_path):
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            pages.append(page.extract_text() or '')
    return '\n'.join(pages)

# ── Bill summary parser ───────────────────────────────────────────────────────

def parse_bill_summary(full_text):
    m = re.search(r'TOTAL DUE\s*\n?\s*(?:Hi\s+\w+,\s*\n\s*)?\$?([\d,]+\.\d{2})', full_text)
    if not m:
        m2 = re.search(r'Totals\s+\$[\d,]+\.\d{2}\s+(?:\$[\d,]+\.\d{2}|-)\s+(?:\$[\d,]+\.\d{2}|-)\s+\$([\d,]+\.\d{2})', full_text)
        total_due = parse_amount(m2.group(1)) if m2 else 0.0
    else:
        total_due = parse_amount(m.group(1))

    bi = re.search(r'(\w+ \d+, \d{4})\s+\d{9}', full_text)
    bill_issue = bi.group(1) if bi else ''

    summary_start = full_text.find('THIS BILL SUMMARY')
    if summary_start == -1:
        return {'lines': {}, 'account_line': {}, 'summary_totals': {}, 'total_due': total_due, 'bill_issue': bill_issue}
    summary_text = full_text[summary_start:summary_start + 3000]

    dollar_re = r'\-?\$[\d,]+\.\d{2}'
    # Handles 4-col and 5-col bill formats
    phone_re = re.compile(
        r'\((\d{3})\)\s+(\d{3}-\d{4})\s+'
        r'(?:Voice|Mobile Internet|Data|New Voice)\s+'
        r'(Included|' + dollar_re + r')\s+'
        r'(' + dollar_re + r'|-)\s+'
        r'(' + dollar_re + r'|-)\s+'
        r'(?:(?:' + dollar_re + r'|-)\s+)?'
        r'(' + dollar_re + r')'
    )
    lines = {}
    for m in phone_re.finditer(summary_text):
        area, num = m.group(1), m.group(2)
        phone = f'{area}-{num}'
        plans_str = m.group(3)
        plans = 0.0 if plans_str == 'Included' else parse_amount(plans_str)
        lines[phone] = {
            'plans':            round(plans, 2),
            'equipment':        round(parse_amount(m.group(4)), 2),
            'services':         round(parse_amount(m.group(5)), 2),
            'total':            round(parse_amount(m.group(6)), 2),
            'included_in_plan': plans_str == 'Included',
        }

    acct_re = re.compile(
        r'^Account\s+(' + dollar_re + r'|-)\s+(' + dollar_re + r'|-)\s+(' + dollar_re + r'|-)\s+(' + dollar_re + r')',
        re.MULTILINE
    )
    am = acct_re.search(summary_text)
    account_line = {
        'plans': parse_amount(am.group(1)), 'equipment': parse_amount(am.group(2)),
        'services': parse_amount(am.group(3)), 'total': parse_amount(am.group(4)),
    } if am else {}

    tot_re = re.compile(
        r'^Totals\s+(' + dollar_re + r'|-)\s+(' + dollar_re + r'|-)\s+(' + dollar_re + r'|-)\s+(' + dollar_re + r')',
        re.MULTILINE
    )
    tm = tot_re.search(summary_text)
    summary_totals = {
        'plans': parse_amount(tm.group(1)), 'equipment': parse_amount(tm.group(2)),
        'services': parse_amount(tm.group(3)), 'total': parse_amount(tm.group(4)),
    } if tm else {}

    return {'lines': lines, 'account_line': account_line,
            'summary_totals': summary_totals, 'total_due': total_due, 'bill_issue': bill_issue}

# ── Equipment detail parser ───────────────────────────────────────────────────

def parse_equipment_detail(full_text):
    result = {}
    hs_match = re.search(r'(?:^|\n)(HANDSETS)\s*\n', full_text)
    if hs_match:
        handsets_start = hs_match.start()
    else:
        detailed_start = full_text.find('DETAILED CHARGES')
        handsets_start = full_text.find('EQUIPMENT', detailed_start if detailed_start != -1 else 0)
    if handsets_start == -1:
        return result

    equip_text = full_text[handsets_start:handsets_start + 10000]
    lines_list = equip_text.split('\n')
    dollar_re = r'\-?\$[\d,]+\.\d{2}'
    installment_re = re.compile(
        r'\$([\d,]+\.\d{2})\s+installment\s+with\s+\$([\d,]+\.\d{2})\s+([\w\s]+?)\s*\(?(?:ID\d+)?\)?'
    )
    inst_num_re = re.compile(r'Installment\s+(\d+)\s+of\s+(\d+)')
    balance_re  = re.compile(r'Balance:\s+\$([\d,]+\.\d{2})')
    new_phone_re = re.compile(r'^\(\d{3}\)\s+\d{3}-\d{4}\s+')

    for i, line in enumerate(lines_list):
        m = re.search(r'\((\d{3})\)\s+(\d{3}-\d{4})\s+(.+)\s+(' + dollar_re + r')', line.strip())
        if not m:
            continue
        device_candidate = m.group(3).strip()
        if re.match(r'^(?:Voice|Mobile Internet|Data|Included)\b', device_candidate):
            continue
        phone = f'{m.group(1)}-{m.group(2)}'
        net_amount = parse_amount(m.group(4))
        gross = promo = promo_name = inst_num = inst_of = balance = None
        for j in range(i + 1, min(i + 7, len(lines_list))):
            nxt = lines_list[j].strip()
            if new_phone_re.match(nxt) and j > i + 1:
                break
            im = installment_re.search(nxt)
            if im:
                gross = parse_amount(im.group(1))
                promo = parse_amount(im.group(2))
                promo_name = im.group(3).strip()
            nm = inst_num_re.search(nxt)
            if nm:
                inst_num, inst_of = int(nm.group(1)), int(nm.group(2))
            bm = balance_re.search(nxt)
            if bm:
                balance = parse_amount(bm.group(1))
        result.setdefault(phone, []).append({
            'device':          m.group(3).strip(),
            'net':             round(net_amount, 2),
            'gross':           round(gross, 2) if gross is not None else None,
            'promo_credit':    round(promo, 2) if promo is not None else None,
            'promo_name':      promo_name,
            'installment_num': inst_num,
            'installment_of':  inst_of,
            'balance':         round(balance, 2) if balance is not None else None,
        })
    return result

# ── Full PDF processor ────────────────────────────────────────────────────────

def process_pdf(pdf_path):
    month_str = pdf_filename_to_month(str(pdf_path))
    if not month_str:
        print(f'ERROR: cannot determine month from filename: {Path(pdf_path).name}')
        print('  Expected format: DetailedBill<Month><Year>.pdf  e.g. DetailedBillJun2026.pdf')
        return None, None

    full_text = extract_all_text(str(pdf_path))
    summary   = parse_bill_summary(full_text)
    equipment = parse_equipment_detail(full_text)

    enriched = {}
    for phone, data in summary['lines'].items():
        info = PHONE_MAP.get(phone, {})
        entry = {**data}
        entry['name']     = info.get('name', f'Unknown ({phone})')
        entry['group']    = info.get('group', 'unknown')
        entry['lineName'] = info.get('label', phone)
        if phone in equipment:
            entry['equipment_detail'] = equipment[phone]
        enriched[phone] = entry

    groups = {}
    for phone, data in enriched.items():
        g = data.get('group', 'unknown')
        if g not in groups:
            groups[g] = {'lines': [], 'total': 0.0, 'plans': 0.0, 'equipment': 0.0}
        groups[g]['lines'].append(phone)
        groups[g]['total']     = round(groups[g]['total']     + data.get('total', 0.0), 2)
        groups[g]['plans']     = round(groups[g]['plans']     + data.get('plans', 0.0), 2)
        groups[g]['equipment'] = round(groups[g]['equipment'] + data.get('equipment', 0.0), 2)

    m = re.search(r'T-Mobile fees & charges\s+\$([\d,]+\.\d{2})', full_text)
    tmobile = parse_amount(m.group(1)) if m else 0.0
    m = re.search(r'Government taxes & fees\s+\$([\d,]+\.\d{2})', full_text)
    govt = parse_amount(m.group(1)) if m else 0.0

    bill_record = {
        'month':          month_str,
        'total_due':      summary['total_due'],
        'bill_issue':     summary['bill_issue'],
        'summary_totals': summary['summary_totals'],
        'account_line':   summary['account_line'],
        'lines':          enriched,
        'group_totals':   groups,
        'taxes':          {'tmobile_fees': tmobile, 'govt_fees': govt, 'total': round(tmobile + govt, 2)},
    }
    return month_str, bill_record

# ── LineItems generator (reads bill_record, no historyData needed) ────────────

def make_equipment_sublabel(eq):
    device = eq.get('device', '')[:40]
    parts = []
    inst, inst_of = eq.get('installment_num'), eq.get('installment_of')
    gross, promo = eq.get('gross'), eq.get('promo_credit')
    if inst and inst_of:
        parts.append(f'installment {inst}/{inst_of}')
    if gross and promo and promo > 0:
        parts.append(f'${gross:.2f} − ${promo:.2f} promo = ${gross - promo:.2f}')
    elif gross:
        parts.append(f'${gross:.2f}/mo')
    return ', '.join(parts) if parts else None


def generate_lineitems(bill_record):
    """
    Build lineitems for all groups in one month's bill record.
    Returns { group: { items: [...], phone_sum: float } }

    account_share is NOT stored here — it's computed at runtime in lineItemsData.ts
    from (share.lineCharges + share.sharedCostShare) - phone_sum.
    """
    phone_lines = {k: v for k, v in bill_record['lines'].items()
                   if not k.startswith('_')}
    result = {}

    for group, phones in GROUP_PHONES.items():
        present = [ph for ph in phones if ph in phone_lines]
        if not present:
            continue

        phone_sum = sum(phone_lines[ph].get('total', 0.0) for ph in present)
        items = []

        for phone in present:
            line = phone_lines[phone]
            label = PHONE_MAP[phone]['label']
            plans    = line.get('plans', 0.0)
            equipment = line.get('equipment', 0.0)
            included  = line.get('included_in_plan', False)
            eq_details = line.get('equipment_detail', [])

            if plans > 0 and not included:
                items.append({'label': f'{label} — plan', 'amount': round(plans, 2), 'kind': 'plan'})

            if equipment > 0:
                device_items = [e for e in eq_details if e.get('installment_num')]
                if device_items:
                    for eq in device_items:
                        device = eq.get('device', 'Device')[:40]
                        sublabel = make_equipment_sublabel(eq)
                        item = {'label': f'{label} — {device}',
                                'amount': round(eq.get('net', equipment), 2),
                                'kind': 'equipment'}
                        if sublabel:
                            item['sublabel'] = sublabel
                        items.append(item)
                else:
                    items.append({'label': f'{label} — device installment',
                                  'amount': round(equipment, 2), 'kind': 'equipment'})
            elif equipment < 0:
                items.append({'label': f'{label} — promo credit',
                              'amount': round(abs(equipment), 2), 'kind': 'promo_credit'})

        if items:
            result[group] = {'items': items, 'phone_sum': round(phone_sum, 2)}

    return result

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print('Usage: python3 scripts/process_new_bill.py <path/to/DetailedBill*.pdf>')
        sys.exit(1)

    pdf_path = Path(sys.argv[1]).expanduser()
    if not pdf_path.exists():
        print(f'ERROR: file not found: {pdf_path}')
        sys.exit(1)

    print(f'Processing {pdf_path.name} …')

    # ── Step 1: extract bill data ─────────────────────────────────────────────
    month, bill_record = process_pdf(pdf_path)
    if not bill_record:
        sys.exit(1)

    n_lines = len([k for k in bill_record['lines'] if not k.startswith('_')])
    print(f'  Month:  {month}')
    print(f'  Total:  ${bill_record["total_due"]:.2f}')
    print(f'  Lines:  {n_lines} phone lines found')
    groups_found = list(bill_record['group_totals'].keys())
    print(f'  Groups: {", ".join(groups_found)}')

    # ── Step 2: upsert into tmobile_bill_data.json ────────────────────────────
    bill_data_path = Path('src/data/tmobile_bill_data.json')
    if bill_data_path.exists():
        with open(bill_data_path) as f:
            all_bill_data = json.load(f)
    else:
        all_bill_data = {}

    existed = month in all_bill_data
    all_bill_data[month] = bill_record
    with open(bill_data_path, 'w') as f:
        json.dump(dict(sorted(all_bill_data.items())), f, indent=2)
    action = 'updated' if existed else 'added'
    print(f'\n✓ {action} {month} in {bill_data_path}')

    # ── Step 3: generate and upsert into lineitems_by_month.json ─────────────
    lineitems_path = Path('src/data/lineitems_by_month.json')
    if lineitems_path.exists():
        with open(lineitems_path) as f:
            all_lineitems = json.load(f)
    else:
        all_lineitems = {}

    lineitems = generate_lineitems(bill_record)
    existed_li = month in all_lineitems
    all_lineitems[month] = lineitems
    with open(lineitems_path, 'w') as f:
        json.dump(dict(sorted(all_lineitems.items())), f, indent=2)
    action = 'updated' if existed_li else 'added'
    print(f'✓ {action} {month} in {lineitems_path}')

    # ── Summary ───────────────────────────────────────────────────────────────
    print(f'\nLine items generated:')
    for group, data in lineitems.items():
        n = len(data['items'])
        psum = data['phone_sum']
        print(f'  {group:12s}  {n} items  phone_sum=${psum:.2f}')

    print(f'\nNext steps:')
    print(f'  git add src/data/tmobile_bill_data.json src/data/lineitems_by_month.json')
    print(f'  git commit -m "Add {month} bill data and line items"')
    print(f'  git push')
    print(f'  # CI deploys → upload the PDF in the app → line items will show')


if __name__ == '__main__':
    main()
