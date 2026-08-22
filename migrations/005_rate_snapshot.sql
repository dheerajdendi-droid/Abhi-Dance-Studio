-- Snapshot the rate/tier in effect at the moment a session is marked,
-- instead of deriving it later from the student's (possibly since-changed)
-- current level. This makes a mid-month tier change billing-safe: past
-- sessions keep whatever rate was true when they were recorded.

ALTER TABLE attendance_records ADD COLUMN rate_applied NUMERIC(6,2);
ALTER TABLE attendance_records ADD COLUMN tier_label TEXT;

-- Backfill existing rows using each student's rate at migration time —
-- the best available guess for history predating this column.
UPDATE attendance_records ar
SET rate_applied = CASE s.level
      WHEN 'junior' THEN settings.junior_rate
      WHEN 'intermediate' THEN settings.intermediate_rate
      WHEN 'senior' THEN settings.senior_rate
      ELSE settings.advanced_rate
    END,
    tier_label = s.level
FROM students s, settings
WHERE ar.student_id = s.id
  AND ar.rate_applied IS NULL;

ALTER TABLE attendance_records ALTER COLUMN rate_applied SET NOT NULL;
ALTER TABLE attendance_records ALTER COLUMN tier_label SET NOT NULL;
