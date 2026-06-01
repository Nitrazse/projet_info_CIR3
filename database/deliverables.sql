-- Module Livrables — Tâche 3
-- À exécuter dans Supabase SQL Editor après projects.sql

-- Table principale des livrables
CREATE TABLE IF NOT EXISTS deliverables (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  nom                   VARCHAR(255) NOT NULL,
  storage_path          TEXT NOT NULL,
  type_fichier          VARCHAR(100),
  deposant_id           UUID NOT NULL,
  statut                VARCHAR(20) DEFAULT 'soumis'
    CHECK (statut IN ('soumis', 'valide', 'rejete')),
  commentaire_validation TEXT,
  valide_par            UUID,
  valide_at             TIMESTAMP,
  -- Versioning
  version               INTEGER NOT NULL DEFAULT 1,
  livrable_parent_id    UUID REFERENCES deliverables(id) ON DELETE SET NULL,
  created_at            TIMESTAMP DEFAULT now(),
  updated_at            TIMESTAMP DEFAULT now()
);

-- Colonnes de versioning (migration si la table existait déjà sans elles)
ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS version            INTEGER NOT NULL DEFAULT 1;
ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS livrable_parent_id UUID REFERENCES deliverables(id) ON DELETE SET NULL;
ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS valide_par         UUID;
ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS valide_at          TIMESTAMP;

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_statut     ON deliverables(statut);
CREATE INDEX IF NOT EXISTS idx_deliverables_deposant   ON deliverables(deposant_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_parent     ON deliverables(livrable_parent_id);

-- Contrainte : un déposant ne peut pas avoir deux livrables du même nom à la même version dans le même projet
CREATE UNIQUE INDEX IF NOT EXISTS uniq_deliverable_version
  ON deliverables(project_id, nom, version);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_deliverables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_deliverables_updated_at
  BEFORE UPDATE ON deliverables
  FOR EACH ROW EXECUTE FUNCTION update_deliverables_updated_at();

-- Table notifications (si elle n'existe pas encore)
CREATE TABLE IF NOT EXISTS notifications (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  destinataire_id  UUID NOT NULL,
  type             VARCHAR(50) NOT NULL,
  message          TEXT NOT NULL,
  project_id       UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id          UUID,
  lu               BOOLEAN DEFAULT false,
  created_at       TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_destinataire ON notifications(destinataire_id);
CREATE INDEX IF NOT EXISTS idx_notifications_lu           ON notifications(destinataire_id, lu);

-- RLS : chaque utilisateur ne voit que ses propres notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (auth.uid() = destinataire_id);

CREATE POLICY notifications_insert ON notifications
  FOR INSERT WITH CHECK (true); -- créées par le backend (service role)

CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (auth.uid() = destinataire_id);
