-- Adds a fourth "advanced" rate tier above senior.
-- Purely additive: existing junior/intermediate/senior students, rates,
-- and billing history are untouched.

ALTER TABLE settings ADD COLUMN advanced_rate NUMERIC(6,2) NOT NULL DEFAULT 12.00;

-- Widen the students.level CHECK to allow 'advanced'. Named explicitly by
-- migration 003, so it can be dropped by name here.
ALTER TABLE students DROP CONSTRAINT students_level_check;
ALTER TABLE students ADD CONSTRAINT students_level_check CHECK (level IN ('junior', 'intermediate', 'senior', 'advanced'));
