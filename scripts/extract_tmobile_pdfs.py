#!/usr/bin/env python3
"""
T-Mobile PDF Bill Extractor
============================
Processes all DetailedBill*.pdf files in a given directory and extracts
structured per-line data for each phone number.

Usage:
    python3 scripts/extract_tmobile_pdfs.py [PDF_DIR] [OUTPUT_JSON]

Defaults:
    PDF_DIR      ~/Downloads/T-Mobile
    OUTPUT_JSON  src/data/tmobile_bill_data.json

Output format:
{
  "2026-01": {
    "month": "2026-01",
    "total_due": 648.02,
    "bill_issue": "Jan 24, 2026",
    "account_line": {"plans": 316.65, "services": 3.00, "total": 319.65},
    "lines": {
      "208-840-1299": {
        "name": "Sanjay", "group": "dari", "lineName": "Sanjay",
        "plans": 5.51, "equipment": 21.04, "services": 0, "total": 26.55,
        "included_in_plan": false,
        "equipment_detail": [{
          "device": "iPhone 16 Pro - Natural Titanium - 128GB",
          "net": 21.04, "gross": 41.67, "promo_credit": 20.63,
          "promo_name": "R120 Apple Trade",
          "installment_num": 9, "installment_of": 24, "balance": 624.96
        }]
      },
      ...
    },
    "group_totals": {
      "dari": {"lines": ["208-840-1299"], "total": 26.55, "plans": 5.51, "equipment": 21.04}
    },
    "taxes": {"tmobile_fees": 47.85, "govt_fees": 11.89, "total": 59.74}
  }
}

Phone number → person mapping:
  208-840-1299  Sanjay        dari
  401-207-7052  Saket         saket
  401-338-8422  Chiranjiwi    chiranjiwi
  617-955-9929  Bikas         bikas
  857-205-9815  Ritesh        ritesh
  857-264-9862  Saroj/Mainali mainali
  407-416-5178  Manoj/Bajpayee bajpayee
  252-350-3063  Sapana        bajpayee
  701-412-4006  Mahima        dari   (added Jan 2026)
  701-415-5731  Dari-old      dari   (old number, pre-2024)
  863-449-8681  Home Internet saket
  863-606-2309  Home Internet saket  (new number, ~2026)
"""

import os, re, json, sys
from pathlib import Path
import pdfplumber

# ── Configuration ────────────────────────────────────────────────────────────

PHONE_MAP = {
    '208-840-1299': {'name': 'Sanjay',         'group': 'dari',       'lineName': 'Sanjay'},
    '401-207-7052': {'name': 'Saket',           'group': 'saket',      'lineName': 'Saket iPhone'},
    '401-338-8422': {'name': 'Chiranjiwi',      'group': 'chiranjiwi', 'lineName': 'Chiranjiwi'},
    '617-955-9929': {'name': 'Bikas',           'group': 'bikas',      'lineName': 'Bikas'},
    '857-205-9815': {'name': 'Ritesh',          'group': 'ritesh',     'lineName': 'Ritesh'},
    '857-264-9862': {'name': 'Saroj/Mainali',   'group': 'mainali',    'lineName': 'Mainali iPhone'},
    '407-416-5178': {'name': 'Manoj/Bajpayee',  'group': 'bajpayee',   'lineName': 'Bajpayee iPhone'},
    '252-350-3063': {'name': 'Sapana',          'group': 'bajpayee',   'lineName': 'Sapana iPhone'},
    '701-412-4006': {'name': 'Mahima',          'group': 'dari',       'lineName': '701-412-4006'},
    '701-415-5731': {'name': 'Dari-old',        'group': 'dari',       'lineName': 'Dari'},
    '863-449-8681': {'name': 'Home Internet',   'group': 'saket',      'lineName': 'Home Internet'},
    '863-606-2309': {'name': 'Home Internet',   'group': 'saket',      'lineName': 'Home Internet'},
}

MONTH_NAMES = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
    'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12',
    'January': '01', 'February': '02', 'March': '03', 'April': '04', 'June': '06',
    'July': '07', 'August': '08', 'September': '09', 'October': '10',
    'November': '11', 'December': '12',
}

# ── Helpers ──────────────────────────────────────────────────────────────────

def parse_amount(s):
    """Parse '$21.24' or '-$12.50' → float."""
    if not s or s.strip() in ('-', '—', ''):
        return 0.0
    s = str(s).strip().replace('$', '').replace(',', '')
    try:
        return float(s)
    except ValueError:
        return 0.0


def pdf_filename_to_month(fname):
    """DetailedBillAug2024.pdf → '2024-08'"""
    m = re.match(r'DetailedBill(\w+?)(\d{4})\.pdf', Path(fname).name)
    if not m:
        return None
    mon_name, year = m.group(1), m.group(2)
    mon_num = MONTH_NAMES.get(mon_name)
    if not mon_num:
        return None
    return f'{year}-{mon_num}'


def extract_all_text(pdf_path):
    """Extract concatenated text from all pages of a PDF."""
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            pages.append(page.extract_text() or '')
    return '\n'.join(pages)

# ── Parsers ──────────────────────────────────────────────────────────────────

def parse_bill_summary(full_text, total_due_hint=None):
    """
    Parse 'THIS BILL SUMMARY' table.
    Returns dict: { lines, account_line, summary_totals, total_due, bill_issue }
    """
    # Total due — handle both modern ("TOTAL DUE\n$xxx") and old ("TOTAL DUE\nHi Sanjay,\n$xxx") formats
    m = re.search(r'TOTAL DUE\s*\n?\s*(?:Hi\s+\w+,\s*\n\s*)?\$?([\d,]+\.\d{2})', full_text)
    if not m:
        # Fallback: look for the _totals row in the summary table
        m2 = re.search(r'Totals\s+\$[\d,]+\.\d{2}\s+(?:\$[\d,]+\.\d{2}|-)\s+(?:\$[\d,]+\.\d{2}|-)\s+\$([\d,]+\.\d{2})', full_text)
        total_due = parse_amount(m2.group(1)) if m2 else (total_due_hint or 0.0)
    else:
        total_due = parse_amount(m.group(1))

    # Bill issue date (appears on page 1)
    m = re.search(r'(\w+ \d+, \d{4})\s+\d{9}', full_text)
    bill_issue = m.group(1) if m else ''

    summary_start = full_text.find('THIS BILL SUMMARY')
    if summary_start == -1:
        return {'lines': {}, 'account_line': {}, 'summary_totals': {}, 'total_due': total_due, 'bill_issue': bill_issue}

    summary_text = full_text[summary_start:summary_start + 3000]

    lines = {}

    # Phone number rows in bill summary table
    # Handles both 4-col (Plans/Equip/Svc/Total) and 5-col (Plans/Equip/Svc/One-time/Total) formats
    dollar_re = r'\-?\$[\d,]+\.\d{2}'
    phone_re = re.compile(
        r'\((\d{3})\)\s+(\d{3}-\d{4})\s+'
        r'(?:Voice|Mobile Internet|Data|New Voice)\s+'
        r'(Included|' + dollar_re + r')\s+'
        r'(' + dollar_re + r'|-)\s+'
        r'(' + dollar_re + r'|-)\s+'
        r'(?:(?:' + dollar_re + r'|-)\s+)?'   # optional One-time charges column (5-col format)
        r'(' + dollar_re + r')'
    )
    for m in phone_re.finditer(summary_text):
        area, num = m.group(1), m.group(2)
        phone = f'{area}-{num}'
        plans_str = m.group(3)
        plans = 0.0 if plans_str == 'Included' else parse_amount(plans_str)
        equip = parse_amount(m.group(4))
        svc   = parse_amount(m.group(5))
        total = parse_amount(m.group(6))
        lines[phone] = {
            'plans': round(plans, 2),
            'equipment': round(equip, 2),
            'services': round(svc, 2),
            'total': round(total, 2),
            'included_in_plan': plans_str == 'Included',
        }

    # Account row
    acct_re = re.compile(
        r'^Account\s+(' + dollar_re + r'|-)\s+(' + dollar_re + r'|-)\s+(' + dollar_re + r'|-)\s+(' + dollar_re + r')',
        re.MULTILINE
    )
    m = acct_re.search(summary_text)
    if m:
        account_line = {
            'plans':    parse_amount(m.group(1)),
            'equipment':parse_amount(m.group(2)),
            'services': parse_amount(m.group(3)),
            'total':    parse_amount(m.group(4)),
        }
    else:
        account_line = {}

    # Totals row
    totals_re = re.compile(
        r'^Totals\s+(' + dollar_re + r'|-)\s+(' + dollar_re + r'|-)\s+(' + dollar_re + r'|-)\s+(' + dollar_re + r')',
        re.MULTILINE
    )
    m = totals_re.search(summary_text)
    summary_totals = {}
    if m:
        summary_totals = {
            'plans':    parse_amount(m.group(1)),
            'equipment':parse_amount(m.group(2)),
            'services': parse_amount(m.group(3)),
            'total':    parse_amount(m.group(4)),
        }

    return {
        'lines': lines,
        'account_line': account_line,
        'summary_totals': summary_totals,
        'total_due': total_due,
        'bill_issue': bill_issue,
    }


def parse_equipment_detail(full_text):
    """
    Extract per-phone equipment installment details from the EQUIPMENT section.
    Returns { phone: [{device, gross, promo_credit, promo_name, net, installment_num, installment_of, balance}] }
    """
    result = {}

    # Find the detailed HANDSETS section in "DETAILED CHARGES".
    # Note: "HANDSETS" also appears in the page-1 summary line like "7 HANDSETS = $105.28",
    # so we must find the occurrence that's on its OWN line (not preceded by a digit).
    import re as _re
    # Look for "HANDSETS" as a standalone section header (starts a line)
    hs_match = _re.search(r'(?:^|\n)(HANDSETS)\s*\n', full_text)
    if hs_match:
        handsets_start = hs_match.start()
    else:
        # Fallback: start from DETAILED CHARGES section
        detailed_start = full_text.find('DETAILED CHARGES')
        if detailed_start == -1:
            detailed_start = 0
        handsets_start = full_text.find('EQUIPMENT', detailed_start)
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
        # Use greedy .+ so we capture device name even when pdfplumber merges
        # data-usage columns onto the same line (e.g. "$21.04 4505 minutes of talk &")
        m = re.search(
            r'\((\d{3})\)\s+(\d{3}-\d{4})\s+(.+)\s+(' + dollar_re + r')',
            line.strip()
        )
        if not m:
            continue
        # Skip rows that look like bill summary table lines (device name contains "Voice|Included|-")
        device_candidate = m.group(3).strip()
        if re.match(r'^(?:Voice|Mobile Internet|Data|Included)\b', device_candidate):
            continue

        phone = f'{m.group(1)}-{m.group(2)}'
        device_desc = m.group(3).strip()
        net_amount = parse_amount(m.group(4))

        gross = promo = promo_name = None
        inst_num = inst_of = balance = None

        for j in range(i + 1, min(i + 7, len(lines_list))):
            nxt = lines_list[j].strip()
            # Stop at the next phone's section
            if new_phone_re.match(nxt) and j > i + 1:
                break
            im = installment_re.search(nxt)
            if im:
                gross = parse_amount(im.group(1))
                promo = parse_amount(im.group(2))
                promo_name = im.group(3).strip()
            nm = inst_num_re.search(nxt)
            if nm:
                inst_num = int(nm.group(1))
                inst_of  = int(nm.group(2))
            bm = balance_re.search(nxt)
            if bm:
                balance = parse_amount(bm.group(1))

        entry = {
            'device': device_desc,
            'net': round(net_amount, 2),
            'gross': round(gross, 2) if gross is not None else None,
            'promo_credit': round(promo, 2) if promo is not None else None,
            'promo_name': promo_name,
            'installment_num': inst_num,
            'installment_of': inst_of,
            'balance': round(balance, 2) if balance is not None else None,
        }
        result.setdefault(phone, []).append(entry)

    return result


def parse_taxes(full_text):
    """Extract T-Mobile + government taxes total."""
    tmobile = govt = 0.0
    m = re.search(r'T-Mobile fees & charges\s+\$([\d,]+\.\d{2})', full_text)
    if m:
        tmobile = parse_amount(m.group(1))
    m = re.search(r'Government taxes & fees\s+\$([\d,]+\.\d{2})', full_text)
    if m:
        govt = parse_amount(m.group(1))
    return {'tmobile_fees': tmobile, 'govt_fees': govt, 'total': round(tmobile + govt, 2)}

# ── Main processor ───────────────────────────────────────────────────────────

def process_pdf(pdf_path):
    """Process a single PDF → structured bill record."""
    month_str = pdf_filename_to_month(str(pdf_path))
    if not month_str:
        return None

    try:
        full_text = extract_all_text(str(pdf_path))
    except Exception as e:
        print(f'  ERROR {pdf_path.name}: {e}', file=sys.stderr)
        return None

    summary   = parse_bill_summary(full_text)
    equipment = parse_equipment_detail(full_text)
    taxes     = parse_taxes(full_text)

    # Enrich phone lines with person info and equipment detail
    enriched = {}
    for phone, data in summary['lines'].items():
        info = PHONE_MAP.get(phone, {})
        entry = {**data}
        if info:
            entry['name']     = info['name']
            entry['group']    = info['group']
            entry['lineName'] = info['lineName']
        else:
            entry['name']  = f'Unknown ({phone})'
            entry['group'] = 'unknown'
        if phone in equipment:
            entry['equipment_detail'] = equipment[phone]
        enriched[phone] = entry

    # Build group totals
    groups: dict = {}
    for phone, data in enriched.items():
        g = data.get('group', 'unknown')
        if g not in groups:
            groups[g] = {'lines': [], 'total': 0.0, 'plans': 0.0, 'equipment': 0.0}
        groups[g]['lines'].append(phone)
        groups[g]['total']     = round(groups[g]['total']     + data.get('total', 0.0), 2)
        groups[g]['plans']     = round(groups[g]['plans']     + data.get('plans', 0.0), 2)
        groups[g]['equipment'] = round(groups[g]['equipment'] + data.get('equipment', 0.0), 2)

    return {
        'month':          month_str,
        'total_due':      summary['total_due'],
        'bill_issue':     summary['bill_issue'],
        'summary_totals': summary['summary_totals'],
        'account_line':   summary['account_line'],
        'lines':          enriched,
        'group_totals':   groups,
        'taxes':          taxes,
    }


def main():
    pdf_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / 'Downloads' / 'T-Mobile'
    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path('src/data/tmobile_bill_data.json')

    pdfs = sorted(pdf_dir.glob('DetailedBill*.pdf'))
    print(f'Processing {len(pdfs)} PDFs from {pdf_dir}')

    all_data = {}
    for pdf_path in pdfs:
        month = pdf_filename_to_month(str(pdf_path))
        print(f'  {pdf_path.name} → {month}', end=' ')
        result = process_pdf(pdf_path)
        if result:
            all_data[result['month']] = result
            n = len([k for k in result['lines'] if not k.startswith('_')])
            print(f'✓  ${result["total_due"]:.2f}, {n} lines')
        else:
            print('SKIP')

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, 'w') as f:
        json.dump(all_data, f, indent=2)
    print(f'\nWrote {len(all_data)} months → {out_path}')

    # Summary stats
    for month in sorted(all_data.keys()):
        d = all_data[month]
        groups = list(d['group_totals'].keys())
        print(f'  {month}: ${d["total_due"]:.2f}  groups={",".join(groups)}')


if __name__ == '__main__':
    main()
