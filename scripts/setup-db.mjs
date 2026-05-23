/**
 * Wacht op PostgreSQL, sync schema, seed demo-data.
 * Gebruik: npm run db:setup  (of npm run setup)
 */
import { execSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const MAX_ATTEMPTS = 30;
const DELAY_MS = 2000;

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: process.env });
}

async function waitAndPush() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      run("npx prisma db push");
      return;
    } catch {
      if (attempt === MAX_ATTEMPTS) {
        throw new Error(
          "Database niet bereikbaar. Start PostgreSQL: docker compose up db -d"
        );
      }
      console.log(`Database nog niet klaar (${attempt}/${MAX_ATTEMPTS}), opnieuw proberen…`);
      await sleep(DELAY_MS);
    }
  }
}

console.log("=== Honger database setup ===\n");
await waitAndPush();
run("npm run db:seed");
console.log("\n=== Klaar: schema + seed ===\n");
