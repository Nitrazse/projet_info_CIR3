-- Tâche 1 — Dashboard KPIs + Health Score
-- À exécuter dans Supabase SQL Editor après projects.sql

-- Table jalons (utilisée dans le calcul du health score)
CREATE TABLE IF NOT EXISTS jalons (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  titre         VARCHAR(255) NOT NULL,
  description   TEXT,
  date_echeance DATE NOT NULL,
  statut        VARCHAR(20) DEFAULT 'a_faire'
    CHECK (statut IN ('a_faire', 'en_cours', 'termine')),
  created_at    TIMESTAMP DEFAULT now(),
  updated_at    TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jalons_project    ON jalons(project_id);
CREATE INDEX IF NOT EXISTS idx_jalons_echeance   ON jalons(date_echeance);
CREATE INDEX IF NOT EXISTS idx_jalons_statut     ON jalons(statut);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_jalons_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_jalons_updated_at
  BEFORE UPDATE ON jalons
  FOR EACH ROW EXECUTE FUNCTION update_jalons_updated_at();
