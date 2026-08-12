-- Per-session outgoings (e.g. Teaching Assistant fees, hall rent).
-- Purely additive: does not touch attendance/billing/payments tables or logic.

CREATE TABLE session_outgoings (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('hall_rent', 'teaching_assistant', 'other')),
  label TEXT,
  amount NUMERIC(8,2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_outgoings_class_date ON session_outgoings(class_id, session_date);
