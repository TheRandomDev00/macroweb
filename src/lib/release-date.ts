export function releaseAge(publishedAt: string, now = Date.now()) {
  const published = Date.parse(publishedAt);
  if (!Number.isFinite(published)) return "Unknown date";
  const days = Math.max(0, Math.floor((now - published) / 86_400_000));
  if (days === 0) return "Today";
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? "month" : "months"} ago`;
}
