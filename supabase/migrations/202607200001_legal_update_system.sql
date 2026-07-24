-- Legal documents table
CREATE TABLE legal_documents (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  version TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed initial documents
INSERT INTO legal_documents (slug, version)
VALUES
  ('terms', '1.0.0'),
  ('privacy', '1.0.0'),
  ('popia', '1.0.0'),
  ('vendor_agreement', '1.0.0'),
  ('user_agreement', '1.0.0'),
  ('disputes', '1.0.0'),
  ('safety', '1.0.0');

-- Legal acceptance table
CREATE TABLE legal_acceptance (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  document_slug TEXT NOT NULL,
  accepted_version TEXT NOT NULL,
  accepted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, document_slug)
);
