#!/usr/bin/env python3
"""
T-Mobile Excel Bill Extractor
===============================
Reads T-Mobile.xlsx and extracts per-person monthly charges for 2020–2025.

The Excel has month-named sheets (January–December) with multiple year-blocks
per sheet. Each year-block contains:
  - A header row with person names (Saket, Sanjay, Saroj, Ritesh, Chiranjiwi, Bikas, [Bajpayee])
  - Per-person per-month totals
  - Previous-due / paid tracking

Usage:
    python3 scripts/extract_tmobile_excel.py [EXCEL_PATH] [OUTPUT_JSON]

Defaults:
    EXCEL_PATH   ~/Downloads/T-Mobile.xlsx
    OUTPUT_JSON  src/data/tmobile_excel_data.json

Output format:
{
  "2020-01": {
    "month": "2020-01",
    "source": "excel",
    "totals": {
      "saket": 40.88,
      "dari":  30.88,
      "mainali": 44.88,
      "bikas": 30.88,
      "ritesh": 30.88,
      "chiranjiwi": 30.88
    },
    "excel_total": 209.24
  },
  ...
}

Person column name → group mapping:
  Saket      → saket
  Sanjay     → dari
  Saroj      → mainali
  Ritesh     → ritesh
  Chiranjiwi → chiranjiwi
  Bikas      → bikas
  Bajpayee   → bajpayee
"""

import sys, json
from pathlib import Path
import pandas as pd

PERSON_TO_GROUP = {
    'Saket':      'saket',
    'Sanjay':     'dari',
    'Saroj':      'mainali',
    'Ritesh':     'ritesh',
    'Chiranjiwi': 'chiranjiwi',
    'Bikas':      'bikas',
    'Bajpayee':   'bajpayee',
}

MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

MONTH_NUM = {m: f'{i+1:02d}' for i, m in enumerate(MONTH_NAMES)}


def safe_float(v):
    try:
        f = float(v)
        return round(f, 2) if not pd.isna(f) else None
    except (TypeError, ValueError):
        return None


def extract_from_sheet(df, sheet_name):
    """
    Extract year-blocks from a month sheet.
    Returns list of { year, month_str, totals {group: amount}, raw_row }
    """
    records = []
    mon_num = MONTH_NUM.get(sheet_name)
    if not mon_num:
        return records

    rows = df.values.tolist()
    cols = list(df.columns)
    n_cols = len(cols)

    # Scan for year marker cells (integer 2020–2026)
    year_col_positions = []
    for r_idx, row in enumerate(rows):
        for c_idx, cell in enumerate(row):
            try:
                y = int(cell)
                if 2019 <= y <= 2027:
                    year_col_positions.append((r_idx, c_idx, y))
            except (TypeError, ValueError):
                pass

    for (yr_row, yr_col, year) in year_col_positions:
        # Find the row with person names: look within next 5 rows
        header_row_idx = None
        header_persons = {}  # col_idx → group
        for hr in range(yr_row + 1, min(yr_row + 6, len(rows))):
            row = rows[hr]
            found = {}
            for ci, cell in enumerate(row):
                if isinstance(cell, str) and cell.strip() in PERSON_TO_GROUP:
                    found[ci] = PERSON_TO_GROUP[cell.strip()]
            if found:
                header_row_idx = hr
                header_persons = found
                break

        if not header_persons:
            continue

        # Find the amount row: look for rows where MOST header person cols have numeric values
        # The actual totals are in the row right below the names row (usually), e.g. row 10
        # Look ahead for a row with numbers in most person columns
        totals = {}
        for data_row_idx in range(header_row_idx + 1, min(header_row_idx + 5, len(rows))):
            row = rows[data_row_idx]
            found_amounts = {}
            for ci, group in header_persons.items():
                v = safe_float(row[ci] if ci < len(row) else None)
                if v is not None and v > 0:
                    found_amounts[group] = v
            if len(found_amounts) >= 3:  # at least 3 people with values
                totals = found_amounts
                break

        if totals:
            month_str = f'{year}-{mon_num}'
            excel_total = round(sum(totals.values()), 2)
            records.append({
                'month': month_str,
                'source': 'excel',
                'totals': totals,
                'excel_total': excel_total,
            })

    return records


def main():
    excel_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / 'Downloads' / 'T-Mobile.xlsx'
    out_path   = Path(sys.argv[2]) if len(sys.argv) > 2 else Path('src/data/tmobile_excel_data.json')

    print(f'Reading {excel_path}')
    xl = pd.read_excel(excel_path, sheet_name=None, header=None)

    all_data = {}
    for sheet_name in MONTH_NAMES:
        if sheet_name not in xl:
            continue
        df = xl[sheet_name]
        records = extract_from_sheet(df, sheet_name)
        for rec in records:
            # Deduplicate: keep later entry if month seen twice (more complete data)
            if rec['month'] not in all_data or len(rec['totals']) >= len(all_data[rec['month']]['totals']):
                all_data[rec['month']] = rec
        if records:
            months = [r['month'] for r in records]
            print(f'  {sheet_name}: {months}')

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, 'w') as f:
        json.dump(all_data, f, indent=2)
    print(f'\nWrote {len(all_data)} months → {out_path}')

    for month in sorted(all_data.keys()):
        d = all_data[month]
        totals_str = ', '.join(f'{g}=${v:.2f}' for g, v in sorted(d['totals'].items()))
        print(f'  {month}: {totals_str}')


if __name__ == '__main__':
    main()
