import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage();
const js = [];
page.on("response", (r) => {
  const u = r.url();
  if (u.includes(".js") && r.status() === 200) {
    js.push(u.replace("http://127.0.0.1:4173", ""));
  }
});
await page.goto("http://127.0.0.1:4173/", {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(2500);
const antd = js.filter((u) => /\/es-/.test(u) || /antd/i.test(u));
console.log("JS fetched:", js.length);
for (const u of js) console.log(" ", u);
console.log(antd.length ? `ANTD_LEAK: ${antd.join(",")}` : "NO_ANTD_ON_HOMEPAGE");
await browser.close();
