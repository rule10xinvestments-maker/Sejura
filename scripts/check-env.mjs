import { existsSync, readFileSync } from "node:fs";

const envFiles = [".env", ".env.local"];

function parseEnvFile(path) {
  if (!existsSync(path)) return {};

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
        return [key, value];
      })
  );
}

const fileEnv = Object.assign({}, ...envFiles.map(parseEnvFile));
const env = { ...fileEnv, ...process.env };

function present(name) {
  return typeof env[name] === "string" && env[name].trim().length > 0;
}

const missing = [];

if (!present("NEXT_PUBLIC_SUPABASE_URL")) {
  missing.push("NEXT_PUBLIC_SUPABASE_URL");
}

if (
  !present("NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
  !present("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
) {
  missing.push(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
  );
}

for (const name of [
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY"
]) {
  if (!present(name)) missing.push(name);
}

const optional = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_CALENDAR_REDIRECT_URI",
  "GOOGLE_TOKEN_ENCRYPTION_KEY",
  "EMAIL_PROVIDER",
  "EMAIL_PROVIDER_API_KEY",
  "EMAIL_FROM_ADDRESS",
  "EMAIL_FROM_NAME",
  "APP_BASE_URL"
];
const missingOptional = optional.filter((name) => !present(name));

if (missing.length > 0) {
  console.error("Missing required env names:");
  for (const name of missing) console.error(`- ${name}`);
  if (missingOptional.length > 0) {
    console.warn("Missing optional env names:");
    for (const name of missingOptional) console.warn(`- ${name}`);
  }
  process.exit(1);
}

console.log("Env check OK.");
if (missingOptional.length > 0) {
  console.log("Missing optional env names:");
  for (const name of missingOptional) console.log(`- ${name}`);
}
