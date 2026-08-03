import { useEffect, useRef, useState } from "react";

function computeShouldAutoplay() {
  if (typeof window === "undefined") return false;
  const reduceMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;
  const saveData = Boolean(connection?.saveData);
  const cellular = /cellular|2g|3g|slow-2g/i.test(
    String(connection?.effectiveType || connection?.type || ""),
  );
  return !(reduceMotion || saveData || cellular);
}

function isMobileViewport() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(max-width: 768px)").matches;
}

/**
 * Hero media: poster first, metadata preload, mobile/desktop sources.
 * WebM first, compressed MP4 fallback. No legacy 6MB source.
 * Skips autoplay on cellular / save-data / reduced-motion (M-05 / P2-P01).
 */
export default function HeroVideo() {
  const videoRef = useRef(null);
  const [shouldAutoplay] = useState(computeShouldAutoplay);
  const [sourcesReady, setSourcesReady] = useState(false);
  const [useMobile] = useState(isMobileViewport);

  // Defer attaching heavy media until after first paint / idle (lazy load).
  useEffect(() => {
    let cancelled = false;
    const activate = () => {
      if (!cancelled) setSourcesReady(true);
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(activate, { timeout: 1200 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
      };
    }

    const t = window.setTimeout(activate, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !shouldAutoplay || !sourcesReady) return;
    el.muted = true;
    const play = el.play();
    if (play?.catch) play.catch(() => {});
  }, [shouldAutoplay, sourcesReady]);

  // Prefer WebM when present (generated via `npm run optimize:media -- --video`);
  // compressed MP4 is the guaranteed fallback. Never load herobgvideofinal.mp4 (~6MB).
  const webm = useMobile
    ? "/assets/hero-mobile.webm"
    : "/assets/hero-desktop.webm";
  const mp4 = useMobile
    ? "/assets/hero-mobile.mp4"
    : "/assets/hero-desktop.mp4";

  return (
    <video
      ref={videoRef}
      className="h-full w-full object-cover"
      muted
      loop
      playsInline
      preload="metadata"
      poster="/assets/hero-poster.webp"
      controls={!shouldAutoplay}
      aria-label="Karnataka survey context"
    >
      {sourcesReady ? (
        <>
          <source src={webm} type="video/webm" />
          <source src={mp4} type="video/mp4" />
        </>
      ) : null}
    </video>
  );
}
