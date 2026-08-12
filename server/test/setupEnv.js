const path = require("path");

// override:true so .env.test always wins, even if a shell already exported
// DATABASE_URL — tests must never be able to accidentally hit the dev DB.
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env.test"), override: true });
