require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { pool } = require("./db");

const app = express();
const isProd = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);
app.use(express.json());

app.use(
  session({
    store: new pgSession({ pool, tableName: "user_sessions", createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

const { requireAuth } = require("./middleware/auth");

app.use("/api/auth", require("./routes/auth"));
app.use("/api/classes", requireAuth, require("./routes/classes"));
app.use("/api/students", requireAuth, require("./routes/students"));
app.use("/api/settings", requireAuth, require("./routes/settings"));
app.use("/api/attendance", requireAuth, require("./routes/attendance"));
app.use("/api/billing", requireAuth, require("./routes/billing"));
app.use("/api/payments", requireAuth, require("./routes/payments"));
app.use("/api/dashboard", requireAuth, require("./routes/dashboard"));
app.use("/api/outgoings", requireAuth, require("./routes/outgoings"));

if (isProd) {
  const clientDist = path.join(__dirname, "..", "client", "dist");
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}
