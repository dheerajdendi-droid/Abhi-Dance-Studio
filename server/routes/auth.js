const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const { pool } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const PIN_PATTERN = /^\d{4,6}$/;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again in a few minutes." },
});

router.get("/me", async (req, res) => {
  const { rows } = await pool.query("SELECT pin_hash FROM settings WHERE id = 1");
  const pinSet = !!(rows[0] && rows[0].pin_hash);
  res.json({ authenticated: !!(req.session && req.session.authenticated), pinSet });
});

// First-run: set the PIN when none exists yet.
router.post("/setup", async (req, res) => {
  const { pin } = req.body || {};
  if (!PIN_PATTERN.test(pin || "")) {
    return res.status(400).json({ error: "PIN must be 4-6 digits" });
  }

  const { rows } = await pool.query("SELECT pin_hash FROM settings WHERE id = 1");
  if (rows[0] && rows[0].pin_hash) {
    return res.status(409).json({ error: "PIN already set" });
  }

  const hash = await bcrypt.hash(pin, 10);
  await pool.query("UPDATE settings SET pin_hash = $1, updated_at = now() WHERE id = 1", [hash]);

  req.session.authenticated = true;
  res.json({ ok: true });
});

router.post("/login", loginLimiter, async (req, res) => {
  const { pin } = req.body || {};
  const { rows } = await pool.query("SELECT pin_hash FROM settings WHERE id = 1");
  const pinHash = rows[0] && rows[0].pin_hash;

  if (!pinHash) {
    return res.status(409).json({ error: "No PIN set up yet" });
  }

  const valid = pin && (await bcrypt.compare(pin, pinHash));
  if (!valid) {
    return res.status(401).json({ error: "Incorrect PIN" });
  }

  req.session.authenticated = true;
  res.json({ ok: true });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

router.put("/pin", requireAuth, async (req, res) => {
  const { currentPin, newPin } = req.body || {};
  if (!PIN_PATTERN.test(newPin || "")) {
    return res.status(400).json({ error: "New PIN must be 4-6 digits" });
  }

  const { rows } = await pool.query("SELECT pin_hash FROM settings WHERE id = 1");
  const pinHash = rows[0] && rows[0].pin_hash;
  const valid = pinHash && currentPin && (await bcrypt.compare(currentPin, pinHash));
  if (!valid) {
    return res.status(401).json({ error: "Current PIN is incorrect" });
  }

  const hash = await bcrypt.hash(newPin, 10);
  await pool.query("UPDATE settings SET pin_hash = $1, updated_at = now() WHERE id = 1", [hash]);
  res.json({ ok: true });
});

module.exports = router;
