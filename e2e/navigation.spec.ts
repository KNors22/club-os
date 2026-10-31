import { mkdirSync } from "node:fs";
import { test, expect } from "@playwright/test";
test("seeded accounts support keyboard navigation, responsive settings, error recovery, and member restrictions", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await page.getByLabel("Email address").fill("admin@clubos.example");
  await page.getByLabel("Password").fill("ClubOSDemo2026!");
  await page.getByLabel("Password").press("Enter");
  await expect(page.getByRole("heading", { name: /Your clubs/ })).toBeVisible();
  const clubId = "c10000000000000000000001";
  await page.goto(`/app/${clubId}/settings`);
  await expect(
    page.getByRole("heading", { name: "Club settings." }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const opener = page.getByRole("button", { name: "Open navigation" });
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Workspace navigation" });
  await expect(
    dialog.getByRole("button", { name: "Close navigation" }),
  ).toBeFocused();
  await dialog.getByRole("button", { name: "Sign out" }).focus();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("link", { name: "ClubOS home" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Sign out" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await expect(opener).toHaveAttribute("aria-expanded", "false");
  await expect
    .poll(async () => {
      const bounds = await page.locator("#workspace-nav").boundingBox();
      return bounds ? bounds.x + bounds.width : 0;
    })
    .toBeLessThanOrEqual(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  if (
    process.env.CAPTURE_SCREENSHOTS === "1" &&
    testInfo.project.name === "chrome"
  ) {
    mkdirSync("docs/screenshots", { recursive: true });
    await page.screenshot({
      path: "docs/screenshots/club-settings-mobile.png",
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  let fail = true;
  await page.route(`**/api/organizations/${clubId}/events?*`, async (route) => {
    if (fail)
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "QA_UNAVAILABLE",
            message: "Events are temporarily unavailable.",
          },
        }),
      });
    else await route.continue();
  });
  await page.goto(`/app/${clubId}/events`);
  await expect(
    page.getByText("Events are temporarily unavailable."),
  ).toBeVisible();
  fail = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByRole("link", { name: "Demo community run", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByLabel("Email address").fill("pending@clubos.example");
  await page.getByLabel("Password").fill("ClubOSDemo2026!");
  await page.getByLabel("Password").press("Enter");
  await expect(page.getByRole("heading", { name: /Your clubs/ })).toBeVisible();
  await page.goto(`/app/${clubId}/settings`);
  await expect(page).toHaveURL(new RegExp(`/app/${clubId}$`));
  const membershipCard = page.getByRole("region", {
    name: "Membership card",
    exact: true,
  });
  await expect(
    membershipCard.getByRole("heading", { name: "Available after activation" }),
  ).toBeVisible();
  await expect(
    membershipCard.getByRole("button", { name: "Save card (PNG)" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("link", { name: "Club settings", exact: true }),
  ).toHaveCount(0);
  await page.goto(`/app/${clubId}/events/c30000000000000000000001`);
  await expect(
    page.getByRole("button", { name: "Register for event", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("An active membership is required.", { exact: false }),
  ).toBeVisible();
  await page.goto("/some-missing-route");
  await expect(
    page.getByRole("heading", { name: "Looks like a wrong turn." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
