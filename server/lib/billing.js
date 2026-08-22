const { pool } = require("../db");

// Each attendance record already carries the rate/tier that was in effect
// when it was marked (see attendance.js), so billing reads that snapshot
// instead of looking up the student's current rate — a later tier change
// never rewrites what earlier sessions are billed at.
async function billingRows({ month } = {}) {
  const params = [];
  let where = "";
  if (month) {
    params.push(month);
    where = `WHERE to_char(ar.session_date, 'YYYY-MM') = $${params.length}`;
  }

  const { rows } = await pool.query(
    `
    SELECT s.id AS student_id, s.name AS student_name, s.level, s.parent_phone,
           s.class_id, c.name AS class_name,
           to_char(ar.session_date, 'YYYY-MM') AS month,
           ar.tier_label,
           ar.rate_applied AS rate,
           COUNT(ar.id)::int AS sessions,
           COALESCE(p.paid, false) AS paid,
           p.paid_date
    FROM attendance_records ar
    JOIN students s ON s.id = ar.student_id
    LEFT JOIN classes c ON c.id = s.class_id
    LEFT JOIN payments p ON p.student_id = s.id AND p.month = to_char(ar.session_date, 'YYYY-MM')
    ${where}
    GROUP BY s.id, s.name, s.level, s.parent_phone, s.class_id, c.name,
             to_char(ar.session_date, 'YYYY-MM'), ar.tier_label, ar.rate_applied, p.paid, p.paid_date
    ORDER BY month, class_name NULLS LAST, s.name, ar.rate_applied
    `,
    params
  );

  // Group line-grain rows (one per student × month × rate) into one entry
  // per student × month, carrying a breakdown of the rates it spans.
  const grouped = new Map();
  for (const r of rows) {
    const key = `${r.student_id}|${r.month}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        studentId: r.student_id,
        studentName: r.student_name,
        level: r.level,
        parentPhone: r.parent_phone,
        classId: r.class_id,
        className: r.class_name || "Unassigned",
        month: r.month,
        lines: [],
        sessions: 0,
        amount: 0,
        paid: r.paid,
        paidDate: r.paid_date,
      });
    }
    const entry = grouped.get(key);
    const lineAmount = Number((r.sessions * r.rate).toFixed(2));
    entry.lines.push({
      tierLabel: r.tier_label,
      rate: Number(r.rate),
      sessions: r.sessions,
      amount: lineAmount,
    });
    entry.sessions += r.sessions;
    entry.amount = Number((entry.amount + lineAmount).toFixed(2));
  }

  return Array.from(grouped.values());
}

module.exports = { billingRows };
