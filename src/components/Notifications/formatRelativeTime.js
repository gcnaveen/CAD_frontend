export function formatRelativeTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const ts = d.getTime();
  if (Number.isNaN(ts)) return "";

  let diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 0) diffSec = 0;

  if (diffSec < 45) return "just now";
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min} min${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}
