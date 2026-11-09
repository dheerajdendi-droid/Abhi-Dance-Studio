// Dumps every table to a single timestamped JSON file under backups/.
// Table-by-table row export (not pg_dump) so this works anywhere `pg` runs,
// with no dependency on the pg_dump binary being installed.
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { Client } = require("pg");

const TABLES = ["classes", "students", "settings", "attendance_records", "payments", "session_outgoings"];

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const dump = { takenAt: new Date().toISOString(), tables: {} };
  for (const table of TABLES) {
    const { rows } = await client.query(`SELECT * FROM ${table} ORDER BY id`);
    dump.tables[table] = rows;
  }
  await client.end();

  const backupDir = path.join(__dirname, "..", "backups");
  fs.mkdirSync(backupDir, { recursive: true });

  const stamp = dump.takenAt.replace(/[:.]/g, "-");
  const outPath = path.join(backupDir, `backup-${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(dump, null, 2));

  console.log(`Backup written to ${outPath}`);
  for (const table of TABLES) {
    console.log(`  ${table}: ${dump.tables[table].length} rows`);
  }
}

main().catch((err) => {
  console.error("Backup failed:", err.message);
  process.exit(1);
});
