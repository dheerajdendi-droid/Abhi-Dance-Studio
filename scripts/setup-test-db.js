// Creates (if needed) and migrates the isolated test database used by
// `npm run test:api` / `npm run test:e2e`. Never touches the dev database.
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.test") });
const { Client } = require("pg");

const TEST_DB_URL = process.env.DATABASE_URL;

async function ensureDatabase() {
  const url = new URL(TEST_DB_URL);
  const dbName = url.pathname.slice(1);
  const adminUrl = new URL(TEST_DB_URL);
  adminUrl.pathname = "/postgres";

  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  const { rows } = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (rows.length === 0) {
    console.log(`Creating database "${dbName}"...`);
    await admin.query(`CREATE DATABASE "${dbName}"`);
  } else {
    console.log(`Database "${dbName}" already exists.`);
  }
  await admin.end();
}

async function runMigrations() {
  const client = new Client({ connectionString: TEST_DB_URL });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const dir = path.join(__dirname, "..", "migrations");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  const { rows } = await client.query("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.name));

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    console.log(`Applying migration to test DB: ${file}`);
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`Failed to apply ${file}:`, err.message);
      process.exit(1);
    }
  }

  await client.end();
}

async function main() {
  await ensureDatabase();
  await runMigrations();
  console.log("Test database ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
