const express = require("express");
const { billingRows } = require("../lib/billing");

const router = express.Router();

const MONTH_PATTERN = /^\d{4}-\d{2}$/;

router.get("/outstanding", async (req, res) => {
  const rows = await billingRows({});
  const outstanding = rows
    .filter((r) => !r.paid)
    .sort((a, b) => a.month.localeCompare(b.month) || a.studentName.localeCompare(b.studentName));
  res.json(outstanding);
});

router.get("/:month", async (req, res) => {
  const { month } = req.params;
  if (!MONTH_PATTERN.test(month)) return res.status(400).json({ error: "Invalid month" });

  const rows = await billingRows({ month });
  const groups = new Map();
  for (const r of rows) {
    const key = r.classId || "unassigned";
    if (!groups.has(key)) groups.set(key, { classId: r.classId, className: r.className, students: [] });
    groups.get(key).students.push(r);
  }
  res.json(Array.from(groups.values()));
});

module.exports = router;
