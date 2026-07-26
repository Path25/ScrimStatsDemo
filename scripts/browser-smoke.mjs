import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on("console", (message) => console.log("console", message.type(), message.text()));
page.on("pageerror", (error) => console.log("pageerror", error.message));
await page.goto(process.argv[2] || "http://127.0.0.1:4173/");
if (process.argv[3]) {
  await page.getByRole("link", { name: new RegExp(process.argv[3], "i") }).click();
  await page.waitForTimeout(250);
  console.log("url", page.url());
}
await page.waitForTimeout(1_000);
console.log((await page.locator("body").innerHTML()).slice(0, 2_000));
await browser.close();
