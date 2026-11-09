const express = require("express");
const { asyncRoutes } = require("../middleware/asyncRoutes");
const { pool } = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT junior_rate, intermediate_rate, senior_rate, standard_rate, advanced_rate FROM settings WHERE id = 1"
  );
  res.json(rows[0]);
});

router.put("/", async (req, res) => {
  const { junior_rate, intermediate_rate, senior_rate, standard_rate, advanced_rate } = req.body || {};
  const jr = Number(junior_rate);
  const ir = Number(intermediate_rate);
  const sr = Number(senior_rate);
  const ar = Number(advanced_rate);
  // Optional so an older cached client that does not send it leaves the
  // stored Standard rate unchanged instead of failing or resetting it.
  const stdr = standard_rate === undefined ? null : Number(standard_rate);
  if (
    !Number.isFinite(jr) || jr <= 0 ||
    !Number.isFinite(ir) || ir <= 0 ||
    !Number.isFinite(sr) || sr <= 0 ||
    !Number.isFinite(ar) || ar <= 0 ||
    (stdr !== null && (!Number.isFinite(stdr) || stdr <= 0))
  ) {
    return res.status(400).json({ error: "Rates must be positive numbers" });
  }

  const { rows } = await pool.query(
    "UPDATE settings SET junior_rate = $1, intermediate_rate = $2, senior_rate = $3, advanced_rate = $4, standard_rate = COALESCE($5, standard_rate), updated_at = now() WHERE id = 1 RETURNING junior_rate, intermediate_rate, senior_rate, standard_rate, advanced_rate",
    [jr, ir, sr, ar, stdr]
  );
  res.json(rows[0]);
});

module.exports = asyncRoutes(router);
