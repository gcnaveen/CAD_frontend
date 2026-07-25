/** Minimal fallback while route shells / lazy pages load (M-05). */
export default function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-[40vh] items-center justify-center text-sm text-fg-muted"
    >
      Loading…
    </div>
  );
}
