const express = require("express");
const { pool } = require("../db");
const { billingRows } = require("../lib/billing");

const router = express.Router();
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

router.get("/summary", async (req, res) => {
  const month = currentMonth();
  const [{ rows: activeRows }, { rows: classRows }, thisMonthRows, allRows] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM students WHERE active"),
    pool.query("SELECT COUNT(*)::int AS count FROM classes"),
    billingRows({ month }),
    billingRows({}),
  ]);

  const thisMonthBilled = thisMonthRows.reduce((sum, r) => sum + r.amount, 0);
  const allTimeOutstanding = allRows.filter((r) => !r.paid).reduce((sum, r) => sum + r.amount, 0);

  res.json({
    activeStudents: activeRows[0].count,
    classesRunning: classRows[0].count,
    thisMonthBilled: Number(thisMonthBilled.toFixed(2)),
    allTimeOutstanding: Number(allTimeOutstanding.toFixed(2)),
    month,
  });
});

router.get("/classes", async (req, res) => {
  const month = req.query.month || currentMonth();
  if (!MONTH_PATTERN.test(month)) return res.status(400).json({ error: "Invalid month" });

  const { rows: classes } = await pool.query(`
    SELECT c.id, c.name, COUNT(s.id) FILTER (WHERE s.active) AS student_count
    FROM classes c
    LEFT JOIN students s ON s.class_id = c.id
    GROUP BY c.id
    ORDER BY c.name
  `);

  const rows = await billingRows({ month });
  const byClass = new Map();
  for (const r of rows) {
    if (!r.classId) continue;
    if (!byClass.has(r.classId)) byClass.set(r.classId, { sessions: 0, billed: 0, collected: 0 });
    const agg = byClass.get(r.classId);
    agg.sessions += r.sessions;
    agg.billed += r.amount;
    if (r.paid) agg.collected += r.amount;
  }

  const result = classes.map((c) => {
    const agg = byClass.get(c.id) || { sessions: 0, billed: 0, collected: 0 };
    return {
      classId: c.id,
      className: c.name,
      studentCount: Number(c.student_count),
      sessions: agg.sessions,
      billed: Number(agg.billed.toFixed(2)),
      collected: Number(agg.collected.toFixed(2)),
    };
  });

  res.json({ month, classes: result });
});

module.exports = router;
