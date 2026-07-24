CREATE TABLE IF NOT EXISTS melissa_safety_rules (
  action_type TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL,
  updated_by TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO melissa_safety_rules (action_type, enabled, updated_by)
VALUES
  ('close_ticket', true, 'seed'),
  ('reassign_ticket', true, 'seed'),
  ('payout_recheck', true, 'seed'),
  ('vendor_reminder', true, 'seed'),
  ('compliance_reminder', true, 'seed'),
  ('flag_vendor', true, 'seed'),
  ('suspend_vendor', false, 'seed'),
  ('suspend_user', false, 'seed'),
  ('pause_payouts', false, 'seed'),
  ('modify_ranking_algorithm', false, 'seed'),
  ('modify_booking_rules', false, 'seed'),
  ('modify_legal_documents', false, 'seed')
ON CONFLICT (action_type) DO NOTHING;
