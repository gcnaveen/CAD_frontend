import React from "react";

/** Karnataka map (filled districts). Asset: public/karnataka-outline.svg (Wikimedia CC BY-SA 3.0). */
export default function KarnatakaOutlineDecor({ variant = "center" }) {
  const rootClass =
    variant === "right"
      ? "karnataka-outline-decor karnataka-outline-decor--right"
      : variant === "auth"
        ? "karnataka-outline-decor karnataka-outline-decor--auth"
        : "karnataka-outline-decor";

  return (
    <div className={rootClass} aria-hidden>
      <img
        src="/karnataka-outline.svg"
        alt=""
        className="karnataka-outline-decor__img"
        width={255}
        height={392}
        decoding="async"
        fetchPriority="low"
      />
    </div>
  );
}
