/** Joins class names, skipping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** "3m ago", "2h ago", "5d ago" — compact relative time. */
export function timeAgo(date: string | Date | undefined): string {
  if (!date) return "";
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.floor((Date.now() - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** ISO-3166 alpha-2 → flag emoji ("IN" → 🇮🇳). */
export function countryFlag(code?: string): string {
  if (!code || code.length !== 2) return "";
  const base = 0x1f1e6 - 65;
  const cc = code.toUpperCase();
  return (
    String.fromCodePoint(base + cc.charCodeAt(0)) +
    String.fromCodePoint(base + cc.charCodeAt(1))
  );
}

/** First letter for avatar fallbacks. */
export function initialOf(name?: string): string {
  return (name?.trim()?.[0] ?? "?").toUpperCase();
}
