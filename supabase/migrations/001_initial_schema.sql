-- Finco — Initial Schema
-- Single-user MVP: RLS intentionally disabled

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL UNIQUE,
  color TEXT,
  icon  TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE auto_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword     TEXT NOT NULL,
  category    TEXT NOT NULL,
  subcategory TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE expenses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description       TEXT NOT NULL,
  amount            DECIMAL(10,2) NOT NULL,
  date              DATE NOT NULL,
  category          TEXT,
  subcategory       TEXT,
  source            TEXT DEFAULT 'manual',
  source_file       TEXT,
  installment_of    UUID REFERENCES expenses(id),
  installment_num   INT,
  installment_total INT,
  pix_e2e_id        TEXT,
  raw_text_data     TEXT,
  extraction_source TEXT,
  raw_ai_data       JSONB,
  duplicate_score   DECIMAL(5,2),
  merged_with       UUID REFERENCES expenses(id),
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE expense_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id  UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity    DECIMAL(10,3),
  unit_price  DECIMAL(10,2),
  amount      DECIMAL(10,2) NOT NULL,
  category    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE discarded_uploads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_text   TEXT NOT NULL,
  reason     TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_pix_e2e_id ON expenses(pix_e2e_id) WHERE pix_e2e_id IS NOT NULL;
CREATE INDEX idx_expenses_merged_with ON expenses(merged_with) WHERE merged_with IS NOT NULL;
CREATE INDEX idx_expense_items_expense_id ON expense_items(expense_id);
CREATE INDEX idx_auto_rules_keyword ON auto_rules(keyword);

-- ============================================================
-- Seed: Default Categories
-- ============================================================

INSERT INTO categories (name, color, icon) VALUES
  ('Alimentação',  '#EF4444', 'utensils'),
  ('Transporte',   '#3B82F6', 'car'),
  ('Moradia',      '#22C55E', 'house'),
  ('Saúde',        '#EC4899', 'heart'),
  ('Educação',     '#8B5CF6', 'book'),
  ('Lazer',        '#F97316', 'gamepad'),
  ('Compras',      '#EAB308', 'shopping-bag'),
  ('Serviços',     '#6B7280', 'wrench'),
  ('Outros',       '#94A3B8', 'dots');

-- ============================================================
-- Seed: Default Auto-categorization Rules
-- ============================================================

INSERT INTO auto_rules (keyword, category, subcategory) VALUES
  ('iFood',   'Alimentação', 'Delivery'),
  ('Rappi',   'Alimentação', 'Delivery'),
  ('Uber',    'Transporte',  'Uber'),
  ('99',      'Transporte',  '99'),
  ('Netflix', 'Lazer',       'Streaming'),
  ('Spotify', 'Lazer',       'Streaming'),
  ('Amazon',  'Compras',     'Online');
