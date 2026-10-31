import { mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
test("public visitors can sign in, save current membership cards, and identify expired cards", async ({
  page,
  browser,
}, testInfo) => {
  await page.goto("/login");
  const demo = page.getByRole("region", { name: "Public sample accounts" });
  await expect(demo).toContainText("ClubOSDemo2026!");
  await expect(
    demo.getByLabel("Explore another account").locator("option"),
  ).toHaveCount(9);
  expect(
    await demo
      .getByLabel("Explore another account")
      .locator("option")
      .evaluateAll((options) =>
        options.slice(1).map((option) => (option as HTMLOptionElement).value),
      ),
  ).toEqual([
    "alex@clubos",
    "jordan@clubos",
    "taylor@clubos",
    "morgan@clubos",
    "maya@clubos",
    "noah@clubos",
    "olivia@clubos",
    "ethan@clubos",
  ]);
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
  await expect(page.getByLabel("Email address")).toHaveValue("jordan@clubos");
  if (capture)
    await demo.screenshot({
      path: "docs/screenshots/public-demo-mobile.png",
      animations: "disabled",
    });
  await page.setViewportSize({ width: 1280, height: 720 });
  await demo.getByRole("button", { name: "Try administrator" }).click();
  await expect(page.getByLabel("Email address")).toHaveValue("alex@clubos");
  await expect(page.getByLabel("Password")).toHaveValue("ClubOSDemo2026!");
  await page.getByRole("button", { name: "Sign in to ClubOS" }).click();
  await expect(page.getByRole("heading", { name: /Your clubs/ })).toBeVisible();
  await page.goto("/app/c10000000000000000000001/settings");
  await expect(
    page.getByRole("heading", { name: "Club settings." }),
  ).toBeVisible();
  const samplePath = "/api/organizations/c10000000000000000000001";
  const stats = await (
    await page.request.get(`${samplePath}/dashboard`)
  ).json();
  expect(stats.counts.total).toBeGreaterThan(25);
  expect(
    stats.analytics.monthly.some(
      (month: { revenueCents: number }) => month.revenueCents > 0,
    ),
  ).toBe(true);
  expect(
    stats.analytics.monthly.some(
      (month: { attendance: number }) => month.attendance > 0,
    ),
  ).toBe(true);
  const maya = (
    await (
      await page.request.get(`${samplePath}/memberships?search=maya`)
    ).json()
  ).memberships[0];
  const history = (
    await (
      await page.request.get(`${samplePath}/memberships/${maya.id}`)
    ).json()
  ).membership;
  expect(history.payments.length).toBeGreaterThanOrEqual(15);
  expect(history.payments[0].paidAt).toMatch(/^2010-/);
  await page.goto(`/app/c10000000000000000000001/members/${maya.id}`);
  await expect(
    page.getByRole("heading", { name: "Maya Desai", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", { name: "Membership payment history" }),
  ).toContainText("2010");
  if (
    process.env.CAPTURE_SAMPLE_DATA === "1" &&
    testInfo.project.name === "chrome"
  ) {
    mkdirSync("docs/screenshots", { recursive: true });
    await page.screenshot({
      path: "docs/screenshots/sample-data-history.png",
      fullPage: true,
    });
    await page.goto("/app/c10000000000000000000001");
    await expect(
      page.getByRole("img", { name: "Attendance trend", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: "docs/screenshots/sample-data-dashboard.png",
      fullPage: true,
    });
  }
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

    const membershipPath =
      "/api/organizations/c10000000000000000000001/memberships/me";
    const before = (await (await member.request.get(membershipPath)).json())
      .membership;
    const club = (
      await (
        await page.request.get("/api/organizations/c10000000000000000000001")
      ).json()
    ).organization;
    // Disposable QA data only: renew while the member's page still has the old dates.
    const payment = await page.request.post(
      `/api/organizations/${club.id}/memberships/${before.id}/payments`,
      {
        headers: { Origin: new URL(page.url()).origin },
        data: {
          requestId: randomUUID(),
          amountCents: club.feeCents,
          method: "cash",
          reference: "Browser card freshness",
          paidAt: new Date().toISOString(),
        },
      },
    );
    expect(payment.status()).toBe(201);
    const renewed = (await payment.json()).membership;
    expect(renewed.expiresAt).not.toBe(before.expiresAt);
    const cardPanel = member.getByRole("region", {
      name: "Membership card",
      exact: true,
    });
    const [download, snapshotResponse] = await Promise.all([
      member.waitForEvent("download"),
      member.waitForResponse((response) =>
        response.url().endsWith(`${membershipPath}/card`),
      ),
      cardPanel.getByRole("button", { name: "Save card (PNG)" }).click(),
    ]);
    const snapshot = await snapshotResponse.json();
    expect(snapshot.card.expiresAt).toBe(renewed.expiresAt);
    await expect(cardPanel.locator("time")).toHaveAttribute(
      "datetime",
      renewed.expiresAt,
    );
    expect(download.suggestedFilename()).toMatch(/^clubos-.*-active\.png$/);
    expect(await download.failure()).toBeNull();
    const image = await readFile((await download.path())!);
    expect([...image.subarray(0, 8)]).toEqual([
      137, 80, 78, 71, 13, 10, 26, 10,
    ]);
    expect(image.readUInt32BE(16)).toBe(2160);
    expect(image.readUInt32BE(20)).toBe(1360);
    expect(image.length).toBeGreaterThan(1000);
    await expect(cardPanel.getByRole("status")).toContainText(
      "Your PNG is ready",
    );
    const captureCard =
      process.env.CAPTURE_CARDS === "1" && testInfo.project.name === "chrome";
    if (captureCard) {
      mkdirSync("docs/screenshots", { recursive: true });
      await download.saveAs("docs/screenshots/membership-card.png");
      await member.evaluate(() => window.scrollTo(0, 0));
      await member.screenshot({
        path: "docs/screenshots/membership-card-desktop.png",
        fullPage: true,
      });
    }
    await member.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(async () => {
        const bounds = await member.locator("#workspace-nav").boundingBox();
        return bounds ? bounds.x + bounds.width : 0;
      })
      .toBeLessThanOrEqual(1);
    expect(
      await member.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await cardPanel
      .getByRole("button", { name: "Save card (PNG)" })
      .scrollIntoViewIfNeeded();
    await expect(
      cardPanel.getByRole("button", { name: "Save card (PNG)" }),
    ).toBeInViewport();
    if (captureCard) {
      await member.evaluate(() => window.scrollTo(0, 0));
      await member.screenshot({
        path: "docs/screenshots/membership-card-mobile.png",
        fullPage: true,
      });
    }

    // Expiration can change between viewing and saving. Render the server's new status.
    const expired = {
      ...snapshot.card,
      status: "expired",
      startsAt: "2024-10-01T12:00:00Z",
      expiresAt: "2025-10-01T12:00:00Z",
      memberName: "Alexandria " + "Gonzalez".repeat(11),
      clubName: "Community " + "Adventure".repeat(10),
    };
    await member.route(`**${membershipPath}/card`, (route) =>
      route.fulfill({
        json: {
          card: expired,
          membership: {
            ...renewed,
            status: "expired",
            startsAt: expired.startsAt,
            expiresAt: expired.expiresAt,
          },
        },
      }),
    );
    const expiredDownloadPromise = member.waitForEvent("download");
    await cardPanel.getByRole("button", { name: "Save card (PNG)" }).click();
    const expiredDownload = await expiredDownloadPromise;
    expect(await expiredDownload.failure()).toBeNull();
    expect(expiredDownload.suggestedFilename()).toMatch(/-expired\.png$/);
    await expect(
      cardPanel.getByText("Expired membership", { exact: true }),
    ).toBeVisible();
    await expect(cardPanel.getByRole("img")).toHaveAccessibleName(
      new RegExp(expired.memberName),
    );
    await expect(
      cardPanel.getByRole("button", { name: "Save expired card (PNG)" }),
    ).toBeEnabled();
    if (captureCard)
      await expiredDownload.saveAs(
        testInfo.outputPath("expired-long-names-card.png"),
      );
  } finally {
    await context.close();
  }
});
