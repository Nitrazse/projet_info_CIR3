import { supabaseAdmin, createUserClient } from '../config/supabase.js';

// TODO: Retourne la liste des projets visibles pour l'utilisateur connecté
export async function listProjects(req, res) {}

// TODO: Crée un nouveau projet (ENCADRANT uniquement)
export async function createProject(req, res) {}

// TODO: Retourne le détail d'un projet par son ID
export async function getProject(req, res) {}

// TODO: Met à jour les champs d'un projet (ENCADRANT, TEAM_LEADER)
export async function updateProject(req, res) {}

// TODO: Supprime un projet et ses ressources associées (ENCADRANT uniquement)
export async function deleteProject(req, res) {}

// TODO: Ajoute un membre à un projet
export async function addMember(req, res) {}
