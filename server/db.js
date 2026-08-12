const { Pool, types } = require("pg");

// Return DATE columns as raw 'YYYY-MM-DD' strings instead of JS Date
// objects — pg's default parsing applies local-timezone midnight, which
// then shifts by a day once JSON.stringify converts it back to UTC.
types.setTypeParser(types.builtins.DATE, (val) => val);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = { pool };
