import assert from "node:assert/strict";
try {
  const input = process.argv[2] ?? process.env.APP_LIVE_URL;
  assert.ok(
    input,
    "Provide the public HTTPS app origin: npm run verify:live -- https://your-app.onrender.com",
  );
  const origin = new URL(input);
  assert.ok(
    origin.protocol === "https:" &&
      !origin.username &&
      !origin.password &&
      !origin.search &&
      !origin.hash &&
      origin.pathname === "/",
    "Use an HTTPS origin without credentials, path, or query.",
  );
  async function get(path, timeout = 20000) {
    const response = await fetch(new URL(path, origin), {
      signal: AbortSignal.timeout(timeout),
      redirect: "error",
    });
    assert.equal(response.status, 200, `${path} returned ${response.status}`);
    return response;
  }
  const health = await (await get("/api/health", 90000)).json();
  assert.equal(health.database, "connected");
  const config = await (await get("/api/config")).json();
  assert.ok(["demo", "disabled"].includes(config.notifications?.mode));
  for (const path of ["/register", "/app/507f1f77bcf86cd799439011/settings"]) {
    const response = await get(path);
    assert.match(response.headers.get("content-type") ?? "", /html/);
    assert.ok(response.headers.get("content-security-policy"));
    const html = await response.text();
    assert.match(html, /ClubOS/);
    const asset = html.match(/src="([^"]+\.js)"/)?.[1];
    assert.ok(asset);
    assert.ok(
      asset.startsWith("/assets/"),
      "Expected a same-origin compiled asset",
    );
    assert.match(
      (await get(asset)).headers.get("content-type") ?? "",
      /javascript/,
    );
  }
  const missing = await fetch(new URL("/api/missing", origin), {
    signal: AbortSignal.timeout(20000),
    redirect: "error",
  });
  assert.equal(missing.status, 404);
  assert.match(missing.headers.get("content-type") ?? "", /json/);
  console.log(
    `Public readiness passed for ${origin.origin}. Notification mode: ${config.notifications.mode}. No accounts, payments, registrations, or emails were created. Complete the live account workflow and inbox checks separately.`,
  );
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Live readiness verification failed.",
  );
  process.exitCode = 1;
}
