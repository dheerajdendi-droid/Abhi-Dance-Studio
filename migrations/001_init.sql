-- Core schema for Abhi's Dance Studio

CREATE TABLE classes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
  time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('junior','senior')),
  class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  parent_phone TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_active ON students(active);

-- Single-row settings table (studio-wide rates + PIN)
CREATE TABLE settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  junior_rate NUMERIC(6,2) NOT NULL DEFAULT 5.00,
  senior_rate NUMERIC(6,2) NOT NULL DEFAULT 7.00,
  pin_hash TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO settings (id, junior_rate, senior_rate) VALUES (1, 5.00, 7.00);

CREATE TABLE attendance_records (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, session_date)
);

CREATE INDEX idx_attendance_class_date ON attendance_records(class_id, session_date);
CREATE INDEX idx_attendance_student ON attendance_records(student_id);

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  month CHAR(7) NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, month)
);

CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_paid ON payments(paid);
