import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const destination = new URL("../.env", import.meta.url);
if (existsSync(destination)) {
  console.log("An .env file already exists; it was left unchanged.");
} else {
  const example = readFileSync(
    new URL("../.env.example", import.meta.url),
    "utf8",
  );
  writeFileSync(
    destination,
    example.replace(
      "replace-with-a-random-secret-at-least-32-characters-long",
      randomBytes(32).toString("hex"),
    ),
    { mode: 0o600, flag: "wx" },
  );
  console.log(
    "Created .env with a random session secret. Check MONGODB_URI, then run npm run dev.",
  );
}
