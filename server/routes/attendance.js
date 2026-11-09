const express = require("express");
const { asyncRoutes } = require("../middleware/asyncRoutes");
const { pool } = require("../db");

const router = express.Router();

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

router.get("/", async (req, res) => {
  const { class_id, date } = req.query;
  if (!class_id || !DATE_PATTERN.test(date || "")) {
    return res.status(400).json({ error: "class_id and date (YYYY-MM-DD) are required" });
  }
  const { rows } = await pool.query(
    "SELECT student_id FROM attendance_records WHERE class_id = $1 AND session_date = $2",
    [class_id, date]
  );
  res.json({ presentStudentIds: rows.map((r) => r.student_id) });
});

router.post("/", async (req, res) => {
  const { student_id, class_id, session_date } = req.body || {};
  if (!student_id || !class_id || !DATE_PATTERN.test(session_date || "")) {
    return res.status(400).json({ error: "student_id, class_id and session_date are required" });
  }
  await pool.query(
    `INSERT INTO attendance_records (student_id, class_id, session_date, rate_applied, tier_label)
     SELECT $1, $2, $3,
       CASE s.level
         WHEN 'junior' THEN settings.junior_rate
         WHEN 'intermediate' THEN settings.intermediate_rate
         WHEN 'senior' THEN settings.senior_rate
         WHEN 'standard' THEN settings.standard_rate
         ELSE settings.advanced_rate
       END,
       s.level
     FROM students s CROSS JOIN settings
     WHERE s.id = $1
     ON CONFLICT (student_id, session_date) DO NOTHING`,
    [student_id, class_id, session_date]
  );
  res.status(204).end();
});

router.delete("/:studentId/:date", async (req, res) => {
  const { studentId, date } = req.params;
  if (!DATE_PATTERN.test(date)) return res.status(400).json({ error: "Invalid date" });
  await pool.query(
    "DELETE FROM attendance_records WHERE student_id = $1 AND session_date = $2",
    [studentId, date]
  );
  res.status(204).end();
});

router.post("/bulk-mark", async (req, res) => {
  const { class_id, session_date, student_ids } = req.body || {};
  if (!class_id || !DATE_PATTERN.test(session_date || "") || !Array.isArray(student_ids)) {
    return res.status(400).json({ error: "class_id, session_date and student_ids[] are required" });
  }
  if (student_ids.length === 0) return res.json({ presentStudentIds: [] });

  const values = student_ids.map((_, i) => `($${i + 3}::int)`).join(", ");
  await pool.query(
    `INSERT INTO attendance_records (student_id, class_id, session_date, rate_applied, tier_label)
     SELECT v.student_id, $1, $2,
       CASE s.level
         WHEN 'junior' THEN settings.junior_rate
         WHEN 'intermediate' THEN settings.intermediate_rate
         WHEN 'senior' THEN settings.senior_rate
         WHEN 'standard' THEN settings.standard_rate
         ELSE settings.advanced_rate
       END,
       s.level
     FROM (VALUES ${values}) AS v(student_id)
     JOIN students s ON s.id = v.student_id
     CROSS JOIN settings
     ON CONFLICT (student_id, session_date) DO NOTHING`,
    [class_id, session_date, ...student_ids]
  );
  const { rows } = await pool.query(
    "SELECT student_id FROM attendance_records WHERE class_id = $1 AND session_date = $2",
    [class_id, session_date]
  );
  res.json({ presentStudentIds: rows.map((r) => r.student_id) });
});

router.post("/bulk-clear", async (req, res) => {
  const { class_id, session_date } = req.body || {};
  if (!class_id || !DATE_PATTERN.test(session_date || "")) {
    return res.status(400).json({ error: "class_id and session_date are required" });
  }
  await pool.query("DELETE FROM attendance_records WHERE class_id = $1 AND session_date = $2", [
    class_id,
    session_date,
  ]);
  res.json({ presentStudentIds: [] });
});

module.exports = asyncRoutes(router);
