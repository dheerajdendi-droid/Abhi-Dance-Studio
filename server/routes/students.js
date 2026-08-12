const express = require("express");
const { pool } = require("../db");

const router = express.Router();

function validateStudentInput(body, { partial = false } = {}) {
  const { name, level, parent_phone } = body || {};
  if (!partial || name !== undefined) {
    if (!name || !name.trim()) return "Student name is required";
  }
  if (!partial || level !== undefined) {
    if (level !== "junior" && level !== "senior") return "Level must be junior or senior";
  }
  if (parent_phone && !/^[+\d][\d\s()-]{5,20}$/.test(parent_phone)) {
    return "Parent phone number looks invalid";
  }
  return null;
}

router.get("/", async (req, res) => {
  const includeInactive = req.query.include_inactive === "true";
  const { rows } = await pool.query(
    `
    SELECT s.*,
      CASE WHEN s.level = 'junior' THEN settings.junior_rate ELSE settings.senior_rate END AS rate,
      c.name AS class_name, c.day_of_week AS class_day, c.time AS class_time
    FROM students s
    CROSS JOIN settings
    LEFT JOIN classes c ON c.id = s.class_id
    WHERE ($1 OR s.active)
    ORDER BY s.name
    `,
    [includeInactive]
  );
  res.json(rows);
});

router.post("/", async (req, res) => {
  const error = validateStudentInput(req.body);
  if (error) return res.status(400).json({ error });

  const { name, level, class_id, parent_phone } = req.body;
  const { rows } = await pool.query(
    "INSERT INTO students (name, level, class_id, parent_phone) VALUES ($1, $2, $3, $4) RETURNING *",
    [name.trim(), level, class_id || null, parent_phone || null]
  );
  res.status(201).json(rows[0]);
});

router.put("/:id", async (req, res) => {
  const error = validateStudentInput(req.body, { partial: true });
  if (error) return res.status(400).json({ error });

  const existing = await pool.query("SELECT * FROM students WHERE id = $1", [req.params.id]);
  if (!existing.rows[0]) return res.status(404).json({ error: "Student not found" });
  const current = existing.rows[0];

  const name = req.body.name !== undefined ? req.body.name.trim() : current.name;
  const level = req.body.level !== undefined ? req.body.level : current.level;
  const class_id = req.body.class_id !== undefined ? req.body.class_id : current.class_id;
  const parent_phone = req.body.parent_phone !== undefined ? req.body.parent_phone : current.parent_phone;
  const active = req.body.active !== undefined ? !!req.body.active : current.active;

  const { rows } = await pool.query(
    "UPDATE students SET name = $1, level = $2, class_id = $3, parent_phone = $4, active = $5 WHERE id = $6 RETURNING *",
    [name, level, class_id, parent_phone, active, req.params.id]
  );
  res.json(rows[0]);
});

// Soft delete — preserves attendance/payment history.
router.delete("/:id", async (req, res) => {
  const { rows } = await pool.query(
    "UPDATE students SET active = false WHERE id = $1 RETURNING id",
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Student not found" });
  res.status(204).end();
});

router.get("/:id/history", async (req, res) => {
  const studentRes = await pool.query(
    `
    SELECT s.*, CASE WHEN s.level = 'junior' THEN settings.junior_rate ELSE settings.senior_rate END AS rate
    FROM students s CROSS JOIN settings WHERE s.id = $1
    `,
    [req.params.id]
  );
  const student = studentRes.rows[0];
  if (!student) return res.status(404).json({ error: "Student not found" });

  const attendanceRes = await pool.query(
    `
    SELECT to_char(session_date, 'YYYY-MM') AS month,
           COUNT(*)::int AS sessions,
           array_agg(to_char(session_date, 'YYYY-MM-DD') ORDER BY session_date) AS dates
    FROM attendance_records
    WHERE student_id = $1
    GROUP BY month
    ORDER BY month DESC
    `,
    [req.params.id]
  );

  const paymentsRes = await pool.query(
    "SELECT month, paid, paid_date FROM payments WHERE student_id = $1",
    [req.params.id]
  );
  const paymentsByMonth = Object.fromEntries(paymentsRes.rows.map((p) => [p.month, p]));

  const months = attendanceRes.rows.map((row) => {
    const payment = paymentsByMonth[row.month];
    return {
      month: row.month,
      sessions: row.sessions,
      dates: row.dates,
      amountOwed: Number((row.sessions * student.rate).toFixed(2)),
      paid: !!(payment && payment.paid),
      paidDate: payment ? payment.paid_date : null,
    };
  });

  res.json({ student, months });
});

module.exports = router;
