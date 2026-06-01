-- Tâche 2 — Détail projet, feedbacks, tracking vues
-- À exécuter dans Supabase SQL Editor après projects.sql

-- Table feedbacks encadrant sur un projet
CREATE TABLE IF NOT EXISTS project_feedbacks (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  auteur_id   UUID NOT NULL,
  contenu     TEXT NOT NULL,
  type        VARCHAR(20) DEFAULT 'general'
    CHECK (type IN ('general', 'livrable', 'avancement', 'alerte')),
  created_at  TIMESTAMP DEFAULT now(),
  updated_at  TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_project ON project_feedbacks(project_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_auteur  ON project_feedbacks(auteur_id);

-- Table tracking des dernières visites par utilisateur sur un projet
CREATE TABLE IF NOT EXISTS project_views (
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL,
  last_viewed_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_views_user ON project_views(user_id);

-- Trigger updated_at pour feedbacks
CREATE OR REPLACE FUNCTION update_project_feedbacks_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_project_feedbacks_updated_at
  BEFORE UPDATE ON project_feedbacks
  FOR EACH ROW EXECUTE FUNCTION update_project_feedbacks_updated_at();
