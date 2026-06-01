-- Module Évaluations — Tâche 4
-- À exécuter dans Supabase SQL Editor après projects.sql

-- Table des grilles d'évaluation paramétrables
-- criteres = [{ "nom": "Rapport écrit", "description": "...", "poids": 40 }, ...]
CREATE TABLE IF NOT EXISTS grilles (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom         VARCHAR(255) NOT NULL,
  description TEXT,
  criteres    JSONB NOT NULL DEFAULT '[]',
  createur_id UUID NOT NULL,
  created_at  TIMESTAMP DEFAULT now(),
  updated_at  TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grilles_createur ON grilles(createur_id);

-- Table des évaluations
-- notes_criteres = { "Rapport écrit": 15, "Soutenance": 12, "Code": 18 }
-- note = calculée automatiquement (pondérée)
-- statut : brouillon → soumise (verrouillée)
CREATE TABLE IF NOT EXISTS evaluations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  grille_id       UUID REFERENCES grilles(id) ON DELETE SET NULL,
  evaluateur_id   UUID NOT NULL,
  notes_criteres  JSONB NOT NULL DEFAULT '{}',
  note            NUMERIC(5,2) CHECK (note >= 0 AND note <= 20),
  commentaire     TEXT,
  statut          VARCHAR(20) DEFAULT 'brouillon'
    CHECK (statut IN ('brouillon', 'soumise')),
  soumise_at      TIMESTAMP,
  created_at      TIMESTAMP DEFAULT now(),
  updated_at      TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_project    ON evaluations(project_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluateur ON evaluations(evaluateur_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_statut     ON evaluations(statut);

-- Migration si la table evaluations existait déjà sans les nouvelles colonnes
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS grille_id      UUID REFERENCES grilles(id) ON DELETE SET NULL;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS notes_criteres JSONB NOT NULL DEFAULT '{}';
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS statut         VARCHAR(20) DEFAULT 'brouillon'
  CHECK (statut IN ('brouillon', 'soumise'));
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS soumise_at     TIMESTAMP;

-- Trigger updated_at pour grilles
CREATE OR REPLACE FUNCTION update_grilles_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_grilles_updated_at
  BEFORE UPDATE ON grilles
  FOR EACH ROW EXECUTE FUNCTION update_grilles_updated_at();

-- Trigger updated_at pour evaluations
CREATE OR REPLACE FUNCTION update_evaluations_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION update_evaluations_updated_at();

-- Exemples de grilles (optionnel — à commenter si non souhaité)
-- INSERT INTO grilles (nom, description, criteres, createur_id) VALUES (
--   'Grille standard CIR3',
--   'Grille d''évaluation par défaut pour les projets CIR3',
--   '[
--     {"nom": "Rapport écrit",  "description": "Qualité du rapport final", "poids": 40},
--     {"nom": "Soutenance",     "description": "Présentation orale",       "poids": 30},
--     {"nom": "Code source",    "description": "Qualité et lisibilité du code", "poids": 30}
--   ]',
--   '<uuid-encadrant>'
-- );
