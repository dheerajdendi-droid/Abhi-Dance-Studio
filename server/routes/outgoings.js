const express = require("express");
const { pool } = require("../db");

const router = express.Router();

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CATEGORIES = new Set(["hall_rent", "teaching_assistant", "other"]);

router.get("/", async (req, res) => {
  const { class_id, date } = req.query;
  if (!class_id || !DATE_PATTERN.test(date || "")) {
    return res.status(400).json({ error: "class_id and date (YYYY-MM-DD) are required" });
  }
  const { rows } = await pool.query(
    "SELECT * FROM session_outgoings WHERE class_id = $1 AND session_date = $2 ORDER BY created_at",
    [class_id, date]
  );
  res.json(rows);
});

router.get("/suggestions", async (req, res) => {
  const { class_id } = req.query;
  if (!class_id) return res.status(400).json({ error: "class_id is required" });

  const { rows } = await pool.query(
    `
    SELECT DISTINCT ON (category, COALESCE(label, '')) category, label, amount, session_date
    FROM session_outgoings
    WHERE class_id = $1
    ORDER BY category, COALESCE(label, ''), session_date DESC, created_at DESC
    `,
    [class_id]
  );
  rows.sort((a, b) => b.session_date.localeCompare(a.session_date));
  res.json(rows.slice(0, 5));
});

router.post("/", async (req, res) => {
  const { class_id, session_date, category, label, amount } = req.body || {};
  if (!class_id || !DATE_PATTERN.test(session_date || "")) {
    return res.status(400).json({ error: "class_id and session_date are required" });
  }
  if (!CATEGORIES.has(category)) {
    return res.status(400).json({ error: "category must be hall_rent, teaching_assistant, or other" });
  }
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  const { rows } = await pool.query(
    "INSERT INTO session_outgoings (class_id, session_date, category, label, amount) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [class_id, session_date, category, label || null, amt]
  );
  res.status(201).json(rows[0]);
});

router.delete("/:id", async (req, res) => {
  const { rowCount } = await pool.query("DELETE FROM session_outgoings WHERE id = $1", [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: "Outgoing not found" });
  res.status(204).end();
});

module.exports = router;
