CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY,
  pass_number TEXT,
  completed_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT NOT NULL,
  visit_purpose TEXT NOT NULL,
  quiz_score INTEGER NOT NULL
);
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS pass_number TEXT;
ALTER TABLE visitors ALTER COLUMN pass_number DROP NOT NULL;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS visitor_type TEXT NOT NULL DEFAULT 'guest';
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS training_language TEXT NOT NULL DEFAULT 'pl';
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS blacklisted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS blacklist_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS blacklisted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS visitors_completed_idx ON visitors(completed_at DESC);
CREATE INDEX IF NOT EXISTS visitors_phone_idx ON visitors(phone);
CREATE INDEX IF NOT EXISTS visitors_name_idx ON visitors(lower(first_name), lower(last_name));

CREATE TABLE users (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL UNIQUE CHECK (username = lower(username)),
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'guard')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE questions (
  id TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('pl','en','de','tr')),
  text TEXT NOT NULL,
  options JSONB NOT NULL CHECK (jsonb_array_length(options) = 4),
  correct_option_id TEXT NOT NULL CHECK (correct_option_id IN ('a','b','c','d')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (language, id)
);
CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  audience TEXT NOT NULL CHECK (audience IN ('guest','subcontractor')),
  language TEXT NOT NULL CHECK (language IN ('pl','en','de','tr')),
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE UNIQUE INDEX videos_one_active_idx ON videos(language, audience) WHERE active;
CREATE TABLE quiz_attempts (
  token_hash TEXT PRIMARY KEY,
  language TEXT NOT NULL,
  questions JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);
CREATE INDEX quiz_expiry_idx ON quiz_attempts(expires_at);
CREATE TABLE data_imports (
  name TEXT PRIMARY KEY,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
