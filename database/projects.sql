-- Tables créées par Blaise — module projets
-- À exécuter dans Supabase SQL Editor

CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  description TEXT,
  statut VARCHAR(50) DEFAULT 'en_cours'
    CHECK (statut IN ('propose','valide','en_cours','en_retard','livre','soutenu','cloture')),
  encadrant_id UUID,
  date_debut DATE,
  date_fin DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID,
  role VARCHAR(50) DEFAULT 'etudiant'
    CHECK (role IN ('etudiant','team_leader','encadrant','jury')),
  joined_at TIMESTAMP DEFAULT now(),
  UNIQUE(project_id, user_id)
);