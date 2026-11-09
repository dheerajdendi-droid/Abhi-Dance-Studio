const { Pool, types } = require("pg");

// Return DATE columns as raw 'YYYY-MM-DD' strings instead of JS Date
// objects — pg's default parsing applies local-timezone midnight, which
// then shifts by a day once JSON.stringify converts it back to UTC.
types.setTypeParser(types.builtins.DATE, (val) => val);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Fail fast instead of hanging when the database is paused/unreachable.
  // 8s leaves room for a serverless Postgres cold start but stays inside
  // Vercel's function time limit.
  connectionTimeoutMillis: 8000,
  statement_timeout: 10000,
});

// An idle client erroring (e.g. the database restarting) must not crash the
// process via an unhandled 'error' event.
pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err.message);
});

module.exports = { pool };
