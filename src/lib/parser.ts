import type { ParsedBill, LineItem, SharedCosts } from './types';

// Extract T-Mobile bill data from PDF text
export function parseTMobileBillText(text: string, month: string): ParsedBill {
  const lines: LineItem[] = [];
  const sharedCosts: SharedCosts = {
    homeInternet: 0,
    streaming: 0,
    basePlan: 0,
    other: 0,
  };

  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Extract total due
  const totalMatch =
    normalizedText.match(/Total amount due[:\s]*\$?([\d,]+\.?\d*)/i) ??
    normalizedText.match(/Amount Due[:\s]*\$?([\d,]+\.?\d*)/i) ??
    normalizedText.match(/Total Due[:\s]*\$?([\d,]+\.?\d*)/i);
  const totalDue = totalMatch ? parseAmount(totalMatch[1]) : 0;

  // Extract home internet
  const homeInternetMatch = normalizedText.match(
    /Home Internet[^\n]*\$?([\d,]+\.?\d*)/i
  );
  if (homeInternetMatch) {
    sharedCosts.homeInternet = parseAmount(homeInternetMatch[1]);
  }

  // Extract streaming services
  const netflixMatch = normalizedText.match(/Netflix[^\n]*\$?([\d,]+\.?\d*)/i);
  const youtubeMatch = normalizedText.match(/YouTube[^\n]*\$?([\d,]+\.?\d*)/i);
  const appleMatch = normalizedText.match(/Apple TV[^\n]*\$?([\d,]+\.?\d*)/i);
  sharedCosts.streaming =
    (netflixMatch ? parseAmount(netflixMatch[1]) : 0) +
    (youtubeMatch ? parseAmount(youtubeMatch[1]) : 0) +
    (appleMatch ? parseAmount(appleMatch[1]) : 0);

  // Parse per-line sections
  // T-Mobile format varies, but generally:
  // "Line Name\nPhone Number\n...charges..."
  const linePattern =
    /(?:^|\n)([A-Za-z][\w\s'-]+?)\s*\n\s*(\d{3}[-.]?\d{3}[-.]?\d{4})\s*\n([\s\S]+?)(?=\n[A-Za-z][\w\s'-]+?\n\s*\d{3}[-.]?\d{3}[-.]?\d{4}|Account charges|Total charges)/gm;

  let match: RegExpExecArray | null;
  while ((match = linePattern.exec(normalizedText)) !== null) {
    const lineName = match[1].trim();
    const phoneNumber = match[2].replace(/[-. ]/g, '');
    const lineText = match[3];

    const planMatch = lineText.match(/(?:Magenta|Essentials|plan)[^\n]*\$?([\d,]+\.?\d*)/i);
    const equipMatch = lineText.match(
      /(?:Equipment|Installment|EIP)[^\n]*\$?([\d,]+\.?\d*)/i
    );
    const creditMatch = lineText.match(/Credit[^\n]*-\$?([\d,]+\.?\d*)/gi);
    const taxMatch = lineText.match(/(?:Taxes|fees)[^\n]*\$?([\d,]+\.?\d*)/i);

    const totalCredit = creditMatch
      ? creditMatch.reduce((s, m) => {
          const v = m.match(/([\d,]+\.?\d*)/);
          return s + (v ? parseAmount(v[1]) : 0);
        }, 0)
      : 0;

    lines.push({
      lineId: phoneNumber,
      lineName,
      phoneNumber,
      planCost: planMatch ? parseAmount(planMatch[1]) : 0,
      equipmentCost: equipMatch ? parseAmount(equipMatch[1]) : 0,
      creditAmount: totalCredit,
      extras: 0,
      taxes: taxMatch ? parseAmount(taxMatch[1]) : 0,
    });
  }

  // Fallback: extract plan summary table if line-by-line parse failed
  if (lines.length === 0) {
    extractFallbackLines(normalizedText, lines);
  }

  return {
    month,
    totalDue,
    lineItems: lines,
    sharedCosts,
    rawText: text,
  };
}

function extractFallbackLines(text: string, lines: LineItem[]): void {
  // Look for patterns like "Name ... $XX.XX" in summary tables
  const summaryPattern = /([A-Za-z][\w\s]+?)\s{2,}\$?([\d,]+\.\d{2})/g;
  let match: RegExpExecArray | null;
  while ((match = summaryPattern.exec(text)) !== null) {
    const name = match[1].trim();
    if (name.length < 3 || name.length > 40) continue;
    if (/total|amount|due|tax|fee|credit|discount/i.test(name)) continue;
    lines.push({
      lineId: name.toLowerCase().replace(/\s+/g, '-'),
      lineName: name,
      planCost: parseAmount(match[2]),
      equipmentCost: 0,
      creditAmount: 0,
      extras: 0,
      taxes: 0,
    });
  }
}

function parseAmount(s: string): number {
  return parseFloat(s.replace(/,/g, '')) || 0;
}

// Load PDF using pdfjs-dist (client-side only)
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  // Dynamic import to avoid SSR issues
  const pdfjsLib = await import('pdfjs-dist');

  // Worker is copied to public/ for static serving
  const base = import.meta.env.BASE_URL ?? '/';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${base}pdf.worker.min.mjs`;

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: unknown) => {
        const i = item as { str?: string };
        return i.str ?? '';
      })
      .join(' ');
    textParts.push(pageText);
  }

  return textParts.join('\n');
}

// Detect month from PDF filename or text
export function detectMonth(filename: string, text: string): string {
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  // Try filename: DetailedBillJan2025.pdf
  const fileMatch = filename.match(/(\w{3,9})(\d{4})/i);
  if (fileMatch) {
    const monthName = fileMatch[1].toLowerCase();
    const year = fileMatch[2];
    const monthNum = MONTH_MAP[monthName.slice(0, 3)];
    if (monthNum) return `${year}-${monthNum}`;
  }

  // Try PDF text
  const textMatch = text.match(
    /(?:Bill|Statement) (?:for|dated?)[:\s]*(\w+ \d{4})/i
  );
  if (textMatch) {
    const parts = textMatch[1].split(' ');
    const monthNum = MONTH_MAP[parts[0].toLowerCase().slice(0, 3)];
    if (monthNum) return `${parts[1]}-${monthNum}`;
  }

  return defaultMonth;
}

const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04',
  may: '05', jun: '06', jul: '07', aug: '08',
  sep: '09', oct: '10', nov: '11', dec: '12',
};
