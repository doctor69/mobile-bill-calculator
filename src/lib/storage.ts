import type { MonthRecord, AppConfig } from './types';

const RECORDS_KEY = 'tmobile_records';
const CONFIG_KEY = 'tmobile_config';

export function saveRecord(record: MonthRecord): void {
  const all = loadAllRecords();
  const idx = all.findIndex((r) => r.month === record.month);
  if (idx >= 0) all[idx] = record;
  else all.push(record);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
}

export function loadAllRecords(): MonthRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function loadRecord(month: string): MonthRecord | undefined {
  return loadAllRecords().find((r) => r.month === month);
}

export function deleteRecord(month: string): void {
  const all = loadAllRecords().filter((r) => r.month !== month);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
}

export function saveConfig(config: AppConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function loadConfig(): AppConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function exportAllAsJSON(): string {
  return JSON.stringify(loadAllRecords(), null, 2);
}

export function importFromJSON(json: string): number {
  const records: MonthRecord[] = JSON.parse(json);
  const all = loadAllRecords();
  let imported = 0;
  for (const r of records) {
    const idx = all.findIndex((x) => x.month === r.month);
    if (idx >= 0) all[idx] = r;
    else all.push(r);
    imported++;
  }
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
  return imported;
}
