const express = require("express");
const { pool } = require("../db");

const router = express.Router();

const MONTH_PATTERN = /^\d{4}-\d{2}$/;

router.put("/:studentId/:month", async (req, res) => {
  const { studentId, month } = req.params;
  const { paid } = req.body || {};

  if (!MONTH_PATTERN.test(month)) return res.status(400).json({ error: "Invalid month" });

  const { rows } = await pool.query(
    `
    INSERT INTO payments (student_id, month, paid, paid_date, updated_at)
    VALUES ($1, $2, $3, CASE WHEN $3 THEN CURRENT_DATE ELSE NULL END, now())
    ON CONFLICT (student_id, month)
    DO UPDATE SET paid = $3, paid_date = CASE WHEN $3 THEN CURRENT_DATE ELSE NULL END, updated_at = now()
    RETURNING *
    `,
    [studentId, month, !!paid]
  );
  res.json(rows[0]);
});

module.exports = router;
