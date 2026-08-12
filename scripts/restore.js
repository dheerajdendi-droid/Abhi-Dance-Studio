// Restores a JSON backup produced by scripts/backup.js.
// DESTRUCTIVE: wipes classes/students/attendance/payments/settings first.
// Usage: node scripts/restore.js backups/backup-....json --yes
const fs = require("fs");
require("dotenv").config();
const { Client } = require("pg");

const TABLES = ["classes", "students", "attendance_records", "payments"];

async function main() {
  const [, , filePath, confirmFlag] = process.argv;
  if (!filePath) {
    console.error("Usage: node scripts/restore.js <backup-file.json> --yes");
    process.exit(1);
  }
  if (confirmFlag !== "--yes") {
    console.error("This overwrites the current database. Re-run with --yes to confirm:");
    console.error(`  node scripts/restore.js ${filePath} --yes`);
    process.exit(1);
  }

  const dump = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query(`TRUNCATE ${TABLES.join(", ")} RESTART IDENTITY CASCADE`);

    for (const table of TABLES) {
      const rows = dump.tables[table] || [];
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = columns.map((c) => row[c]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
        await client.query(
          `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
          values
        );
      }
      if (rows.length > 0) {
        await client.query(
          `SELECT setval(pg_get_serial_sequence('${table}', 'id'), (SELECT COALESCE(MAX(id), 1) FROM ${table}))`
        );
      }
      console.log(`  ${table}: restored ${rows.length} rows`);
    }

    const settingsRows = dump.tables.settings || [];
    if (settingsRows[0]) {
      const s = settingsRows[0];
      await client.query(
        "UPDATE settings SET junior_rate = $1, senior_rate = $2, pin_hash = $3, updated_at = now() WHERE id = 1",
        [s.junior_rate, s.senior_rate, s.pin_hash]
      );
      console.log("  settings: restored");
    }

    await client.query("COMMIT");
    console.log(`Restore complete from ${filePath} (taken ${dump.takenAt})`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Restore failed:", err.message);
  process.exit(1);
});
