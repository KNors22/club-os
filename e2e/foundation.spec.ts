import { mkdirSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";

test("administrator and member complete the isolated Foundation workflow", async ({
  page,
  browser,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${Date.now()}`;
  const password = "a-long-enough-test-password";
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
  await register(page, "Alex Morgan", `alex-${suffix}@example.com`);
  await page.getByLabel("Club name").fill("Campus Running Club");
  await page
    .getByLabel(/A little about your club/)
    .fill("A place for every pace. Run, connect, and find your people.");
  await page.getByRole("button", { name: "Create club", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /A good day for your club/ }),
  ).toBeVisible();
  const clubId = new URL(page.url()).pathname.split("/")[2];
  const code = (await page.locator("code").textContent())!;
  await page.getByRole("link", { name: "Your clubs", exact: true }).click();
  await page.getByLabel("Club name").fill("Campus Photography Club");
  await page.getByRole("button", { name: "Create club", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /A good day for your club/ }),
  ).toBeVisible();
  const otherClubId = new URL(page.url()).pathname.split("/")[2];

  const memberContext = await browser.newContext({
    baseURL: testInfo.project.use.baseURL,
  });
  try {
    const member = await memberContext.newPage();
    member.on("pageerror", (error) => errors.push(error.message));
    await register(member, "Jordan Lee", `jordan-${suffix}@example.com`);
    await member.getByLabel("Club join code").fill(code);
    await member
      .getByRole("button", { name: "Join a club", exact: true })
      .click();
    await expect(
      member.getByText("Awaiting payment", { exact: true }),
    ).toBeVisible();
    await member.reload();
    await expect(
      member.getByRole("heading", { name: /Welcome to Campus Running Club/ }),
    ).toBeVisible();
    expect(
      (await member.request.get(`/api/organizations/${otherClubId}`)).status(),
    ).toBe(404);
    expect(
      (
        await member.request.get(`/api/organizations/${clubId}/memberships`)
      ).status(),
    ).toBe(403);
    await member.goto(`/app/${otherClubId}/members`);
    await expect(member.getByText("This club isn't available.")).toBeVisible();
    await member.goto("/profile");
    await member.getByLabel("Full name").fill("Jordan Updated");
    await member.getByRole("button", { name: "Save changes" }).click();
    await expect(member.getByRole("status")).toHaveText(
      "Your profile has been updated.",
    );

    await page.goto(`/app/${clubId}/members`);
    await page.getByLabel("Search members by name or email").fill("Jordan");
    await expect(
      page.getByRole("cell", { name: /Jordan Updated/ }),
    ).toBeVisible();
    await page.getByLabel("Status", { exact: true }).selectOption("active");
    await expect(page.getByText("No matches just yet.")).toBeVisible();
    await page.getByLabel("Status", { exact: true }).selectOption("pending");
    await expect(
      page.getByRole("cell", { name: /Jordan Updated/ }),
    ).toBeVisible();

    await page.goto(`/app/${clubId}`);
    await expect(
      page.getByRole("cell", { name: /Jordan Updated/ }),
    ).toBeVisible();
    if (
      process.env.CAPTURE_SCREENSHOTS === "1" &&
      testInfo.project.name === "chrome"
    ) {
      mkdirSync("docs/screenshots", { recursive: true });
      await page.screenshot({
        path: "docs/screenshots/foundation-desktop.png",
        fullPage: true,
      });
    }
    await member.setViewportSize({ width: 390, height: 844 });
    await member.goto(`/app/${clubId}/membership`);
    await expect(
      member.getByText("Awaiting payment", { exact: true }),
    ).toBeVisible();
    expect(
      await member.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await member.getByRole("button", { name: "Open navigation" }).click();
    await expect(
      member.getByRole("button", { name: "Open navigation" }),
    ).toHaveAttribute("aria-expanded", "true");
    await member.getByRole("link", { name: "My account", exact: true }).click();
    await expect(
      member.getByRole("heading", { name: "My account." }),
    ).toBeVisible();
    await member.goto(`/app/${clubId}/membership`);
    await expect(
      member.getByText("Awaiting payment", { exact: true }),
    ).toBeVisible();
    if (
      process.env.CAPTURE_SCREENSHOTS === "1" &&
      testInfo.project.name === "chrome"
    ) {
      await member.screenshot({
        path: "docs/screenshots/foundation-mobile.png",
        fullPage: true,
      });
    }
    await member.getByRole("button", { name: "Open navigation" }).click();
    await member.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(
      member.getByRole("button", { name: "Sign in to ClubOS" }),
    ).toBeVisible();
    await member
      .getByLabel("Email address")
      .fill(`jordan-${suffix}@example.com`);
    await member.getByLabel("Password").fill(password);
    await member.getByRole("button", { name: "Sign in to ClubOS" }).click();
    await expect(
      member.getByRole("heading", { name: /^Your clubs/ }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await memberContext.close();
  }
});
