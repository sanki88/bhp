ALTER TABLE quiz_attempts ADD COLUMN audience TEXT NOT NULL DEFAULT 'guest' CHECK (audience IN ('guest', 'subcontractor'));
