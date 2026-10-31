import { mkdirSync } from "node:fs";
import { test, expect } from "@playwright/test";
test("public visitors can discover demo credentials and sign in as administrator or member", async ({
  page,
  browser,
}, testInfo) => {
  await page.goto("/login");
  const demo = page.getByRole("region", { name: "Public demo accounts" });
  await expect(demo).toContainText("ClubOSDemo2026!");
  const capture =
    process.env.CAPTURE_PUBLIC_DEMO === "1" &&
    testInfo.project.name === "chrome";
  if (capture) {
    mkdirSync("docs/screenshots", { recursive: true });
    await page.screenshot({
      path: "docs/screenshots/public-demo-login.png",
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await demo.getByRole("button", { name: "Try member" }).click();
  await expect(page.getByLabel("Email address")).toHaveValue(
    "member@clubos.example",
  );
  if (capture)
    await demo.screenshot({
      path: "docs/screenshots/public-demo-mobile.png",
      animations: "disabled",
    });
  await page.setViewportSize({ width: 1280, height: 720 });
  await demo.getByRole("button", { name: "Try administrator" }).click();
  await expect(page.getByLabel("Email address")).toHaveValue(
    "admin@clubos.example",
  );
  await expect(page.getByLabel("Password")).toHaveValue("ClubOSDemo2026!");
  await page.getByRole("button", { name: "Sign in to ClubOS" }).click();
  await expect(page.getByRole("heading", { name: /Your clubs/ })).toBeVisible();
  await page.goto("/app/c10000000000000000000001/settings");
  await expect(
    page.getByRole("heading", { name: "Club settings." }),
  ).toBeVisible();
  const context = await browser.newContext({
    baseURL: testInfo.project.use.baseURL,
  });
  try {
    const member = await context.newPage();
    await member.goto("/login");
    await member.getByRole("button", { name: "Try member" }).click();
    await member.getByRole("button", { name: "Sign in to ClubOS" }).click();
    await expect(
      member.getByRole("heading", { name: /Your clubs/ }),
    ).toBeVisible();
    await member.goto("/app/c10000000000000000000001/membership");
    await expect(member.getByText("Active", { exact: true })).toBeVisible();
    await expect(
      member.getByRole("table", { name: "Membership payment history" }),
    ).toBeVisible();
    await expect(
      member.getByRole("link", { name: "Club settings", exact: true }),
    ).toHaveCount(0);
  } finally {
    await context.close();
  }
});
