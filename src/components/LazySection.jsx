import { useEffect, useRef, useState } from "react";

/**
 * Mount children only when near the viewport.
 * Keeps below-fold homepage sections from downloading/executing on first paint.
 */
export default function LazySection({
  children,
  rootMargin = "80px 0px",
  minHeight = 240,
  className = "",
  anchorId,
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    if (visible) return undefined;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  return (
    <div
      ref={ref}
      className={className}
      data-anchor-id={anchorId}
      style={visible ? undefined : { minHeight }}
    >
      {visible ? children : null}
    </div>
  );
}
