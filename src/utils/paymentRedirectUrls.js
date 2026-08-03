/**
 * UX-01: PhonePe / payment return URLs — env only, no localhost fallbacks in production.
 */

function trimUrl(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\/$/, "");
}

function isLocalhostUrl(url) {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
  } catch {
    return /localhost|127\.0\.0\.1/i.test(String(url || ""));
  }
}

/**
 * @param {{ successUrl?: string, failureUrl?: string, isProd?: boolean }} [opts]
 * @returns {{ successUrl: string, failureUrl: string }}
 */
export function getPaymentRedirectUrls(opts = {}) {
  const successUrl = trimUrl(
    opts.successUrl ?? import.meta.env.VITE_PAYMENT_SUCCESS_URL ?? ""
  );
  const failureUrl = trimUrl(
    opts.failureUrl ?? import.meta.env.VITE_PAYMENT_FAILURE_URL ?? ""
  );
  const isProd =
    opts.isProd != null ? Boolean(opts.isProd) : Boolean(import.meta.env.PROD);

  if (isProd) {
    if (!successUrl || !failureUrl) {
      throw new Error(
        "VITE_PAYMENT_SUCCESS_URL and VITE_PAYMENT_FAILURE_URL are required in production builds."
      );
    }
    if (isLocalhostUrl(successUrl) || isLocalhostUrl(failureUrl)) {
      throw new Error(
        "Payment redirect URLs must not use localhost in production."
      );
    }
  }

  return { successUrl, failureUrl };
}

/**
 * Reject PhonePe checkout redirects that point at localhost when running a production build.
 * @param {string} checkoutUrl
 * @param {{ isProd?: boolean }} [opts]
 * @returns {string} same URL if allowed
 */
export function assertSafeCheckoutRedirect(checkoutUrl, opts = {}) {
  const url = typeof checkoutUrl === "string" ? checkoutUrl.trim() : "";
  if (!url) {
    throw new Error("Missing payment checkout URL from server.");
  }
  const isProd =
    opts.isProd != null ? Boolean(opts.isProd) : Boolean(import.meta.env.PROD);
  if (isProd && isLocalhostUrl(url)) {
    throw new Error(
      "Refusing to redirect to a localhost payment URL in production. Check PHONEPE_*_REDIRECT_URL on the API."
    );
  }
  return url;
}

export function isLocalhostPaymentUrl(url) {
  return isLocalhostUrl(url);
}
