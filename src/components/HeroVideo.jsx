import { useEffect, useRef, useState } from "react";

/**
 * Hero media: poster first, metadata preload, mobile/desktop sources.
 * Skips autoplay on cellular / save-data / reduced-motion when possible (M-05).
 */
export default function HeroVideo() {
  const videoRef = useRef(null);
  const [shouldAutoplay, setShouldAutoplay] = useState(false);

  useEffect(() => {
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

    if (reduceMotion || saveData || cellular) {
      setShouldAutoplay(false);
      return;
    }
    setShouldAutoplay(true);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !shouldAutoplay) return;
    el.muted = true;
    const play = el.play();
    if (play?.catch) play.catch(() => {});
  }, [shouldAutoplay]);

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
      <source
        src="/assets/hero-mobile.webm"
        type="video/webm"
        media="(max-width: 768px)"
      />
      <source
        src="/assets/hero-mobile.mp4"
        type="video/mp4"
        media="(max-width: 768px)"
      />
      <source src="/assets/hero-desktop.webm" type="video/webm" />
      <source src="/assets/hero-desktop.mp4" type="video/mp4" />
      {/* Legacy fallback until optimized variants are generated */}
      <source src="/assets/herobgvideofinal.mp4" type="video/mp4" />
    </video>
  );
}
