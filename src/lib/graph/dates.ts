/** Utilitários de data para strings ISO parciais (YYYY, YYYY-MM, YYYY-MM-DD). */

const DAY_MS = 86_400_000;

/** Completa uma data parcial para YYYY-MM-DD (primeiro dia do período). */
export function toFullDate(partial: string): string {
  if (/^\d{4}$/.test(partial)) return `${partial}-01-01`;
  if (/^\d{4}-\d{2}$/.test(partial)) return `${partial}-01`;
  return partial.slice(0, 10);
}

export function parseISO(date: string): number {
  return Date.parse(`${toFullDate(date)}T00:00:00Z`);
}

export function formatISO(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return formatISO(parseISO(date) + days * DAY_MS);
}

export function addMonths(date: string, months: number): string {
  const d = new Date(parseISO(date));
  d.setUTCMonth(d.getUTCMonth() + months);
  return formatISO(d.getTime());
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b) - parseISO(a)) / DAY_MS);
}

export function todayISO(): string {
  return formatISO(Date.now());
}

const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "12 mar 2024" / "mar 2024" / "2024", conforme a precisão da string. */
export function formatDatePT(date?: string): string {
  if (!date) return "sem data";
  const [y, m, d] = date.split("-");
  if (!m) return y;
  const month = MONTHS_PT[Number(m) - 1] ?? m;
  if (!d) return `${month} ${y}`;
  return `${Number(d)} ${month} ${y}`;
}
