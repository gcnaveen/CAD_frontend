import fs from "node:fs";

const file = process.argv[2] || ".lighthouse/mobile-final";
const r = JSON.parse(fs.readFileSync(file, "utf8"));
const cats = r.categories;
const a = r.audits;
const score = (k) => Math.round((cats[k]?.score ?? 0) * 100);

const summary = {
  performance: score("performance"),
  accessibility: score("accessibility"),
  bestPractices: score("best-practices"),
  seo: score("seo"),
  fcp: a["first-contentful-paint"]?.displayValue,
  lcp: a["largest-contentful-paint"]?.displayValue,
  tbt: a["total-blocking-time"]?.displayValue,
  cls: a["cumulative-layout-shift"]?.displayValue,
  si: a["speed-index"]?.displayValue,
  unusedJsBytes: a["unused-javascript"]?.details?.overallSavingsBytes,
  unusedJsItems: (a["unused-javascript"]?.details?.items || [])
    .slice(0, 10)
    .map((i) => ({
      url: String(i.url || "").split("/").pop(),
      wasted: i.wastedBytes,
      total: i.totalBytes,
    })),
  renderBlockMs: a["render-blocking-resources"]?.details?.overallSavingsMs,
  renderItems: (a["render-blocking-resources"]?.details?.items || [])
    .slice(0, 8)
    .map((i) => ({
      url: String(i.url || "").split("/").pop(),
      ms: i.wastedMs,
    })),
  modernImg: a["modern-image-formats"]?.details?.overallSavingsBytes,
  respImg: a["uses-responsive-images"]?.details?.overallSavingsBytes,
  optImg: a["uses-optimized-images"]?.details?.overallSavingsBytes,
  antd: (a["network-requests"]?.details?.items || [])
    .filter((i) => String(i.url).includes("/es-"))
    .map((i) => String(i.url).split("/").pop()),
  mainThread: a["mainthread-work-breakdown"]?.displayValue,
  longTasks: a["long-tasks"]?.details?.items?.length,
  nonComposited: a["non-composited-animations"]?.details?.items?.length,
  imageDeliveryInsight: a["image-delivery-insight"]?.displayValue,
  imageDeliveryBytes: a["image-delivery-insight"]?.details?.overallSavingsBytes,
};
console.log(JSON.stringify(summary, null, 2));
