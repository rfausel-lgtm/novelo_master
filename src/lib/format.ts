/** Formatação pt-BR de datas parciais e números. */

const MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/** "2024-08-13" → "13/08/2024"; "2024-08" → "ago/2024"; "2024" → "2024". */
export function formatPartialDate(date?: string, precision?: string): string {
  if (!date) return "data não informada";
  const [y, m, d] = date.split("-");
  const approx = precision === "approximate" ? "c. " : "";
  if (d && precision !== "month" && precision !== "year") return `${approx}${d}/${m}/${y}`;
  if (m && precision !== "year") return `${approx}${MONTHS[Number(m) - 1]}/${y}`;
  return `${approx}${y}`;
}

export function formatDateTimeBRT(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${fmt.format(dt)} BRT`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(n);
}

export function formatCurrency(amount?: number, currency = "BRL", fallback?: string): string {
  if (amount === undefined) return fallback ?? "valor não informado";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

/** Diferença em dias entre duas datas parciais (usa o dia 01 quando ausente). */
export function daysBetween(a: string, b: string): number {
  const norm = (s: string) => {
    const [y, m = "01", d = "01"] = s.split("-");
    return Date.UTC(Number(y), Number(m) - 1, Number(d));
  };
  return Math.round((norm(b) - norm(a)) / 86_400_000);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((p) => p.length > 2 || p === p.toUpperCase())
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
