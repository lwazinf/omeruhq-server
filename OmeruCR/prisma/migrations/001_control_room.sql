-- OmeruCR — Control Room tables (apply once via Supabase SQL editor or psql)
-- Only cr_ tables are owned by this app. Never migrate the shared tables from here.

CREATE TABLE IF NOT EXISTS cr_operator (
  id            text PRIMARY KEY,
  email         text NOT NULL UNIQUE,
  name          text NOT NULL,
  password_hash text NOT NULL,
  is_root       boolean NOT NULL DEFAULT false,
  permissions   text[] NOT NULL DEFAULT '{}',
  disabled      boolean NOT NULL DEFAULT false,
  last_login_at timestamptz,
  created_by    text,
  "createdAt"   timestamptz NOT NULL DEFAULT now(),
  "updatedAt"   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cr_audit_log (
  id            text PRIMARY KEY,
  operator_id   text REFERENCES cr_operator(id),
  action        text NOT NULL,
  detail        jsonb,
  ip            text,
  "createdAt"   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cr_audit_operator_idx ON cr_audit_log (operator_id, "createdAt");
CREATE INDEX IF NOT EXISTS cr_audit_action_idx   ON cr_audit_log (action, "createdAt");

CREATE TABLE IF NOT EXISTS cr_broadcast (
  id              text PRIMARY KEY,
  operator_id     text NOT NULL REFERENCES cr_operator(id),
  audience        text NOT NULL,
  segment         jsonb,
  message         text NOT NULL,
  recipient_count integer NOT NULL,
  sent_count      integer NOT NULL DEFAULT 0,
  failed_count    integer NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'SENT',
  "createdAt"     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cr_broadcast_created_idx ON cr_broadcast ("createdAt");

-- These tables are only accessed through the CR app's direct Postgres
-- connection (service credentials), never via the Supabase anon key.
ALTER TABLE cr_operator  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cr_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cr_broadcast ENABLE ROW LEVEL SECURITY;
