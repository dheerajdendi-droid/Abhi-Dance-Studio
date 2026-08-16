-- Adds a third "intermediate" rate tier between junior and senior.
-- Purely additive: existing junior/senior students, rates, and billing
-- history are untouched.

ALTER TABLE settings ADD COLUMN intermediate_rate NUMERIC(6,2) NOT NULL DEFAULT 8.00;

-- Widen the students.level CHECK to allow 'intermediate'. The constraint
-- was unnamed in 001_init.sql, so its auto-generated name is looked up
-- rather than assumed.
DO $$
DECLARE
  con_name text;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'students'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%level%';

  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE students DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

ALTER TABLE students ADD CONSTRAINT students_level_check CHECK (level IN ('junior', 'intermediate', 'senior'));
