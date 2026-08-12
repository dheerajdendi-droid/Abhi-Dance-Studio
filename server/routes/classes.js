const express = require("express");
const { pool } = require("../db");

const router = express.Router();

const DAY_ORDER = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SET = new Set(DAY_ORDER);

function validateClassInput(body) {
  const { name, day_of_week, time } = body || {};
  if (!name || !name.trim()) return "Class name is required";
  if (!DAY_SET.has(day_of_week)) return "Valid day of week is required";
  if (!time || !/^\d{2}:\d{2}(:\d{2})?$/.test(time)) return "Valid time is required";
  return null;
}

router.get("/", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT c.*, COUNT(s.id) FILTER (WHERE s.active) AS student_count
    FROM classes c
    LEFT JOIN students s ON s.class_id = c.id
    GROUP BY c.id
  `);
  rows.sort((a, b) => {
    const dayDiff = DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week);
    if (dayDiff !== 0) return dayDiff;
    return a.time.localeCompare(b.time);
  });
  res.json(rows.map((r) => ({ ...r, student_count: Number(r.student_count) })));
});

router.post("/", async (req, res) => {
  const error = validateClassInput(req.body);
  if (error) return res.status(400).json({ error });

  const { name, day_of_week, time } = req.body;
  const { rows } = await pool.query(
    "INSERT INTO classes (name, day_of_week, time) VALUES ($1, $2, $3) RETURNING *",
    [name.trim(), day_of_week, time]
  );
  res.status(201).json(rows[0]);
});

router.put("/:id", async (req, res) => {
  const error = validateClassInput(req.body);
  if (error) return res.status(400).json({ error });

  const { name, day_of_week, time } = req.body;
  const { rows } = await pool.query(
    "UPDATE classes SET name = $1, day_of_week = $2, time = $3 WHERE id = $4 RETURNING *",
    [name.trim(), day_of_week, time, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Class not found" });
  res.json(rows[0]);
});

router.delete("/:id", async (req, res) => {
  const { rows: activeStudents } = await pool.query(
    "SELECT id FROM students WHERE class_id = $1 AND active LIMIT 1",
    [req.params.id]
  );
  if (activeStudents.length > 0) {
    return res.status(409).json({ error: "Move or remove students from this class before deleting it" });
  }

  const { rowCount } = await pool.query("DELETE FROM classes WHERE id = $1", [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: "Class not found" });
  res.status(204).end();
});

module.exports = router;
