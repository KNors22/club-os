import { mkdirSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";

test("club payment, renewal, event, and attendance workflow", async ({
  page,
  browser,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${Date.now()}`;
  const password = "ClubOSDemo2026!";
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  async function register(target: Page, name: string, email: string) {
    await target.goto("/register");
    await target.getByLabel("Full name").fill(name);
    await target.getByLabel("Email address").fill(email);
    await target.getByLabel("Password").fill(password);
    await target.getByRole("button", { name: "Create your account" }).click();
    await expect(
      target.getByRole("heading", { name: /^Your clubs/ }),
    ).toBeVisible();
  }
  await register(page, "Alex Workflow", `admin-${suffix}@example.com`);
  await page.getByLabel("Club name").fill("Campus Running Club");
  await page.getByRole("button", { name: "Create club", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /A good day for your club/ }),
  ).toBeVisible();
  const clubId = new URL(page.url()).pathname.split("/")[2];
  const joinCode = (await page.locator("code").textContent())!;
  const context = await browser.newContext({
    baseURL: testInfo.project.use.baseURL,
  });
  try {
    const member = await context.newPage();
    member.on("pageerror", (error) => errors.push(error.message));
    await register(member, "Jordan Workflow", `member-${suffix}@example.com`);
    await member.getByLabel("Club join code").fill(joinCode);
    await member
      .getByRole("button", { name: "Join a club", exact: true })
      .click();
    await expect(
      member.getByText("Awaiting payment", { exact: true }),
    ).toBeVisible();
    await page.goto(`/app/${clubId}/members`);
    await page
      .getByRole("link", { name: "Manage membership for Jordan Workflow" })
      .click();
    await page.getByLabel("Transaction reference").fill("DEMO-PAYMENT");
    await page.getByRole("checkbox").check();
    await page
      .getByRole("button", { name: "Record payment", exact: true })
      .click();
    await expect(
      page
        .getByRole("table", { name: "Membership payment history" })
        .getByRole("row"),
    ).toHaveCount(2);
    await member.reload();
    await expect(member.getByText("Active", { exact: true })).toBeVisible();
    await expect(
      member
        .getByRole("table", { name: "Membership payment history" })
        .getByRole("row"),
    ).toHaveCount(2);
    const memberDetailsPath = new URL(page.url()).pathname;
    await page.goto(`/app/${clubId}/settings`);
    await page.getByLabel("Membership fee (CAD)").fill("25.50");
    await page.getByRole("button", { name: "Save fee", exact: true }).click();
    await expect(page.getByRole("status")).toContainText(
      "Membership fee updated",
    );
    if (
      process.env.CAPTURE_SCREENSHOTS === "1" &&
      testInfo.project.name === "chrome"
    )
      await page.screenshot({
        path: "docs/screenshots/club-settings-desktop.png",
        fullPage: true,
      });
    await page.goto(memberDetailsPath);
    await expect(page.getByText("$25.50 CAD", { exact: true })).toBeVisible();
    await page.getByLabel("Transaction reference").fill("DEMO-RENEWAL");
    await page.getByRole("checkbox").check();
    await page
      .getByRole("button", { name: "Record renewal", exact: true })
      .click();
    await expect(
      page
        .getByRole("table", { name: "Membership payment history" })
        .getByRole("row"),
    ).toHaveCount(3);
    await page.goto(`/app/${clubId}/events`);
    await page.getByRole("button", { name: "New event" }).click();
    await page.getByLabel("Event title").fill("Weekly campus run");
    await page.getByLabel("Location", { exact: true }).fill("Campus main gate");
    await page.getByLabel("Capacity", { exact: true }).fill("1");
    await page
      .getByRole("button", { name: "Create event", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: /Weekly campus run/ }),
    ).toBeVisible();
    const eventId = new URL(page.url()).pathname.split("/").pop();
    await member.goto(`/app/${clubId}/events`);
    await member
      .getByRole("link", { name: "Weekly campus run", exact: true })
      .click();
    await member
      .getByRole("button", { name: "Register for event", exact: true })
      .click();
    await expect(
      member.getByRole("button", { name: "Cancel registration", exact: true }),
    ).toBeVisible();
    await member
      .getByRole("button", { name: "Cancel registration", exact: true })
      .click();
    await expect(
      member.getByRole("button", { name: "Register for event", exact: true }),
    ).toBeEnabled();
    await member
      .getByRole("button", { name: "Register for event", exact: true })
      .click();
    await expect(
      member.getByRole("button", { name: "Cancel registration", exact: true }),
    ).toBeVisible();
    await page.reload();
    await page
      .getByRole("button", { name: "Check in Jordan Workflow", exact: true })
      .click();
    await expect(page.getByText("Checked in", { exact: true })).toBeVisible();
    if (
      process.env.CAPTURE_SCREENSHOTS === "1" &&
      testInfo.project.name === "chrome"
    ) {
      mkdirSync("docs/screenshots", { recursive: true });
      await page.screenshot({
        path: "docs/screenshots/club-workflows-event.png",
        fullPage: true,
      });
    }
    await member.setViewportSize({ width: 390, height: 844 });
    await member.goto(`/app/${clubId}/events/${eventId}`);
    await expect(member.getByText("Checked in", { exact: true })).toBeVisible();
    await expect(
      member.getByRole("button", { name: "Cancel registration" }),
    ).toHaveCount(0);
    expect(
      await member.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    if (
      process.env.CAPTURE_SCREENSHOTS === "1" &&
      testInfo.project.name === "chrome"
    )
      await member.screenshot({
        path: "docs/screenshots/club-workflows-mobile.png",
        fullPage: true,
      });
    await page.goto(`/app/${clubId}`);
    const summaries = page.getByRole("region", {
      name: "Club workflow summaries",
    });
    await expect(summaries.getByText("$45.50", { exact: true })).toBeVisible();
    await expect(
      summaries.getByText("1 member checked in", { exact: true }),
    ).toBeVisible();
    if (
      process.env.CAPTURE_SCREENSHOTS === "1" &&
      testInfo.project.name === "chrome"
    )
      await page.screenshot({
        path: "docs/screenshots/club-workflows-dashboard.png",
        fullPage: true,
      });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/app/${clubId}/members`);
    await page
      .getByRole("link", { name: "Manage membership for Jordan Workflow" })
      .click();
    await expect(
      page.getByRole("table", { name: "Membership payment history" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
