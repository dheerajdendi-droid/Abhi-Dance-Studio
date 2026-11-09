-- Adds a "standard" rate tier (default £10.00).
-- Purely additive: existing junior/intermediate/senior/advanced students,
-- rates, attendance snapshots (rate_applied/tier_label) and payments are
-- untouched. No rows are updated or deleted. Nobody is moved to this tier
-- automatically.

ALTER TABLE settings ADD COLUMN standard_rate NUMERIC(6,2) NOT NULL DEFAULT 10.00;

-- Widen the students.level CHECK to also allow 'standard'. Every existing
-- value remains valid, so existing rows still satisfy the constraint.
ALTER TABLE students DROP CONSTRAINT students_level_check;
ALTER TABLE students ADD CONSTRAINT students_level_check CHECK (level IN ('junior', 'intermediate', 'senior', 'standard', 'advanced'));
