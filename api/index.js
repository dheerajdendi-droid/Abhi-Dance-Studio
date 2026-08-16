// Vercel serverless entry point. vercel.json rewrites every /api/* request
// here; the original path is preserved on req.url, so Express's own
// /api/... routing inside server/index.js still matches it normally.
module.exports = require("../server/index.js");
