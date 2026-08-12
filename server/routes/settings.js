const express = require("express");
const { pool } = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  const { rows } = await pool.query("SELECT junior_rate, senior_rate FROM settings WHERE id = 1");
  res.json(rows[0]);
});

router.put("/", async (req, res) => {
  const { junior_rate, senior_rate } = req.body || {};
  const jr = Number(junior_rate);
  const sr = Number(senior_rate);
  if (!Number.isFinite(jr) || jr <= 0 || !Number.isFinite(sr) || sr <= 0) {
    return res.status(400).json({ error: "Rates must be positive numbers" });
  }

  const { rows } = await pool.query(
    "UPDATE settings SET junior_rate = $1, senior_rate = $2, updated_at = now() WHERE id = 1 RETURNING junior_rate, senior_rate",
    [jr, sr]
  );
  res.json(rows[0]);
});

module.exports = router;
