import { mkdirSync } from "node:fs";
import { test, expect } from "@playwright/test";
test("v1 charts, full club names, and author credits work on desktop and mobile", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await page
    .getByRole("button", { name: "Try administrator", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Sign in to ClubOS", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: /Your clubs/ })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/app/c10000000000000000000001");
  await expect(
    page.getByRole("region", { name: "Membership status" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Attendance trend", exact: true }),
  ).toBeVisible();
  const summaries = page.getByRole("region", {
    name: "Club workflow summaries",
  });
  await summaries
    .getByRole("link", { name: "Total members", exact: true })
    .click();
  await expect(page).toHaveURL(/\/app\/c10000000000000000000001\/members$/);
  await expect(page.getByLabel("Status", { exact: true })).toHaveValue("all");
  await page.goBack();
  await summaries
    .getByRole("link", { name: "Active members", exact: true })
    .click();
  await expect(page).toHaveURL(/\/members\?status=active$/);
  await expect(page.getByLabel("Status", { exact: true })).toHaveValue(
    "active",
  );
  await expect(
    page.locator(".member-table tbody .status").first(),
  ).toBeVisible();
  expect(
    (await page.locator(".member-table tbody .status").allTextContents()).every(
      (status) => status.trim() === "Active",
    ),
  ).toBe(true);
  await page.reload();
  await expect(page.getByLabel("Status", { exact: true })).toHaveValue(
    "active",
  );
  await page.goBack();
  await summaries
    .getByRole("link", { name: "Upcoming events", exact: true })
    .click();
  await expect(page).toHaveURL(/\/app\/c10000000000000000000001\/events$/);
  await expect(
    page.getByRole("heading", { name: "Events.", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => window.scrollTo(0, 0));
  const payments = summaries.getByRole("button", {
    name: "Payments received",
    exact: true,
  });
  await payments.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("combobox", { name: "Activity metric" }),
  ).toHaveValue("revenueCents");
  await expect(
    page.getByRole("region", { name: "Club insights", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Club insights", exact: true }),
  ).toBeInViewport();
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(100);
  const activity = page.getByRole("region", { name: "Monthly activity" });
  await page
    .getByRole("combobox", { name: "Activity metric" })
    .selectOption("revenueCents");
  await expect(
    activity.getByRole("heading", { name: "Payments received" }),
  ).toBeVisible();
  await activity.getByText("View chart data").click();
  await expect(activity.getByRole("table")).toBeVisible();
  await expect(activity.getByRole("row")).toHaveCount(7);
  await page.getByRole("combobox", { name: "Chart period" }).selectOption("12");
  await activity.getByText("View chart data").click();
  await expect(activity.getByRole("row")).toHaveCount(13);
  await page.getByRole("combobox", { name: "Chart period" }).selectOption("6");
  await page
    .getByRole("combobox", { name: "Activity metric" })
    .selectOption("attendance");
  await expect(
    page
      .getByRole("progressbar", {
        name: "Riverside community run registration capacity",
      })
      .first(),
  ).toHaveAttribute("aria-valuenow", "1");
  const footer = page.getByRole("contentinfo");
  await expect(footer).toContainText(
    `© ${new Date().getFullYear()} Andrey Gonzalez`,
  );
  await expect(
    footer.getByRole("link", { name: "Andrey Gonzalez on GitHub" }),
  ).toHaveAttribute("href", "https://github.com/KNors22");
  const capture =
    process.env.CAPTURE_V1 === "1" && testInfo.project.name === "chrome";
  if (capture) {
    mkdirSync("docs/screenshots", { recursive: true });
    await page.screenshot({
      path: "docs/screenshots/v1-dashboard-desktop.png",
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Member growth" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Payments received", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Activity metric" }),
  ).toHaveValue("revenueCents");
  await expect(
    page.getByRole("heading", { name: "Club insights", exact: true }),
  ).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  if (capture)
    await page.screenshot({
      path: "docs/screenshots/v1-dashboard-mobile.png",
      fullPage: true,
    });
  await page.goto("/clubs");
  const clubName =
    "University Outdoor Society - LakesideCampusAssociationLakesideCampusAssociation";
  await page.getByLabel("Club name").fill(clubName);
  await page.getByRole("button", { name: "Create club", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /A good day for your club/ }),
  ).toBeVisible();
  await expect(
    page.getByText("Your next gathering starts here."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  const name = page.locator(".club-switcher strong");
  await expect(name).toHaveText(clubName);
  expect(
    await name.evaluate((element) => {
      const style = getComputedStyle(element);
      return (
        style.whiteSpace === "normal" &&
        style.textOverflow !== "ellipsis" &&
        element.scrollWidth <= element.clientWidth &&
        element.clientHeight > parseFloat(style.lineHeight)
      );
    }),
  ).toBe(true);
  if (capture)
    await page
      .locator("#workspace-nav")
      .screenshot({ path: "docs/screenshots/v1-sidebar-mobile.png" });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeFocused();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.reload();
  await expect(page.locator(".club-switcher strong")).toHaveText(clubName);
  expect(
    await page
      .locator("#workspace-nav")
      .evaluate((element) => element.getBoundingClientRect().width),
  ).toBeGreaterThanOrEqual(260);
  expect(
    await page
      .locator(".club-switcher strong")
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  expect(errors).toEqual([]);
});
