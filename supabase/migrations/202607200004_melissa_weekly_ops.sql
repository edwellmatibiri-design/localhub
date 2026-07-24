ALTER TABLE melissa_reports
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS payload JSONB;

UPDATE melissa_reports
SET type = COALESCE(type, 'daily_ops')
WHERE type IS NULL;

CREATE INDEX IF NOT EXISTS idx_melissa_reports_type_created_at
  ON melissa_reports(type, created_at DESC);
