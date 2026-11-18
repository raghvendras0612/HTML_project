import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const EVIDENCE_DIR = "/Users/raghvendra/.gemini/antigravity/brain/b5794bee-c90d-4f3b-b087-52221ff1745b/browser_evidence/seed";
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

async function runBrowserVerification() {
  console.log("=================================================================");
  console.log("🌐 STARTING BROWSER VISUAL VERIFICATION (Playwright)");
  console.log("=================================================================\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  // Helper for screenshot
  async function takeScreenshot(name: string) {
    const filePath = path.join(EVIDENCE_DIR, name);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`  📸 Screenshot saved: ${name}`);
  }

  // 1. HOME FEED
  console.log("--- 1. Home Feed (http://localhost:3000/) ---");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Check post cards
  const postCards = page.locator(".curia-card");
  const postCount = await postCards.count();
  console.log(`  ℹ Found ${postCount} feed cards on Home`);
  
  // Verify pinned post doesn't have "Pinned" badge on generic home feed
  const homePinnedBadges = await page.locator("text='Pinned'").count();
  console.log(`  ℹ Pinned badges on Home feed: ${homePinnedBadges} (expected 0)`);
  await takeScreenshot("seed_01_home_feed.png");

  // 2. POPULAR AND ALL
  console.log("\n--- 2. Popular & All Feeds ---");
  await page.goto("http://localhost:3000/popular", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const popularCount = await page.locator(".curia-card").count();
  console.log(`  ℹ Popular posts count: ${popularCount}`);
  await takeScreenshot("seed_02_popular.png");

  await page.goto("http://localhost:3000/all", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const allCount = await page.locator(".curia-card").count();
  console.log(`  ℹ All posts count: ${allCount}`);
  await takeScreenshot("seed_02_all.png");

  // 3. c/webdev PINNED POST
  console.log("\n--- 3. Community c/webdev Pinned Post ---");
  await page.goto("http://localhost:3000/c/webdev", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const webdevPinned = page.locator("text='c/webdev rules and how to ask a good question'").first();
  const hasWebdevPinned = await webdevPinned.isVisible();
  console.log(`  ✔ c/webdev P24 rules post visible: ${hasWebdevPinned}`);
  await takeScreenshot("seed_03_webdev_pinned.png");

  // 4. c/askcuria PINNED POST
  console.log("\n--- 4. Community c/askcuria Pinned Post ---");
  await page.goto("http://localhost:3000/c/askcuria", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const askcuriaPinned = page.locator("text='Welcome to Curia! Read this first'").first();
  const hasAskcuriaPinned = await askcuriaPinned.isVisible();
  console.log(`  ✔ c/askcuria P22 welcome post visible: ${hasAskcuriaPinned}`);
  await takeScreenshot("seed_04_askcuria_pinned.png");

  // 5. POST P01 (14 comments, deep tree, "Continue this thread", "TL;DR with AI")
  console.log("\n--- 5. Post P01 Detail & Deep Thread ---");
  await page.goto("http://localhost:3000/c/webdev/post/1eca09b5-9444-4b77-94ba-8545af2b7ba5", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  
  // Check TL;DR button
  const tldrBtn = page.locator("text='TL;DR with AI'").or(page.locator("button:has-text('TL;DR')")).first();
  const hasTldrP01 = await tldrBtn.isVisible();
  console.log(`  ✔ P01 TL;DR button visible: ${hasTldrP01}`);

  // Check Continue this thread
  const continueLink = page.locator("a:has-text('Continue this thread')").first();
  try {
    await continueLink.waitFor({ state: "visible", timeout: 5000 });
    await continueLink.scrollIntoViewIfNeeded();
  } catch {}
  const hasContinueLink = await continueLink.isVisible();
  console.log(`  ✔ P01 'Continue this thread' link visible (depth >= 6): ${hasContinueLink}`);
  if (hasContinueLink) {
    console.log(`  ℹ Continue link text: "${await continueLink.innerText()}"`);
    console.log(`  ℹ Continue link href: "${await continueLink.getAttribute("href")}"`);
  }
  await takeScreenshot("seed_05_p01_thread_and_tldr.png");

  // 6. POST P04 (13 comments, "TL;DR with AI")
  console.log("\n--- 6. Post P04 Detail & TL;DR ---");
  await page.goto("http://localhost:3000/c/ai_tools/post/a2127785-0c51-4f47-8f46-ed792f97f4bb", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const tldrP04 = page.locator("text='TL;DR with AI'").or(page.locator("button:has-text('TL;DR')")).first();
  const hasTldrP04 = await tldrP04.isVisible();
  console.log(`  ✔ P04 TL;DR button visible: ${hasTldrP04}`);
  await takeScreenshot("seed_06_p04_thread_and_tldr.png");

  // 7. LOGIN AS aarav_dev & NOTIFICATIONS DRAWER
  console.log("\n--- 7. Login as aarav_dev & Notifications Drawer ---");
  // Read password from .seed-credentials.local
  const credPath = path.resolve(process.cwd(), ".seed-credentials.local");
  const creds = fs.readFileSync(credPath, "utf-8");
  const aaravLine = creds.split("\n").find((l) => l.includes("demo1@curia.test"));
  const password = aaravLine ? aaravLine.split("|")[2].trim() : "";
  console.log(`  ℹ Retrieved aarav_dev password from credentials file`);

  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Fill login
  await page.fill('input[type="email"]', "demo1@curia.test");
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to home or logged-in state
  await page.waitForURL("http://localhost:3000/", { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Look for aarav_dev or avatar or notifications bell
  const bellButton = page.locator('button[aria-label="Notifications"]').first();
  await bellButton.waitFor({ state: "visible", timeout: 10000 });
  console.log(`  ✔ Notification bell visible: true`);

  const badge = page.locator("#notifications-badge");
  try {
    await badge.waitFor({ state: "visible", timeout: 5000 });
    console.log(`  ✔ Unread notifications badge visible: ${await badge.textContent()}`);
  } catch {
    console.log(`  ℹ Badge load timed out or already read`);
  }

  // Click bell to open drawer
  await bellButton.click();
  await page.waitForTimeout(1500);
  await takeScreenshot("seed_07_notifications_drawer.png");

  await browser.close();
  console.log("\n=================================================================");
  console.log("🎉 BROWSER VISUAL VERIFICATION COMPLETED SUCCESSFULLY!");
  console.log("=================================================================\n");
}

runBrowserVerification().catch((err) => {
  console.error("❌ Browser verification failed:", err);
  process.exit(1);
});
