import { supabaseAdmin } from '../config/supabase.js';
import { sendError, getPagination } from '../utils/index.js';

// Liste les projets — les étudiants/team_leaders ne voient que les leurs via project_members
export async function listProjects(req, res) {
  const { page, limit, offset } = getPagination(req.query);
  const { role, id: userId } = req.user;

  let query = supabaseAdmin.from('projects').select('*, project_members!inner(user_id)', { count: 'exact' });

  if (role === 'etudiant' || role === 'team_leader') {
    query = query.eq('project_members.user_id', userId);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) return sendError(res, 500, error.message);

  return res.json({ projects: data, total: count, page, limit });
}

// Crée un projet (ENCADRANT uniquement)
export async function createProject(req, res) {
  const { nom, description, date_debut, date_fin } = req.body;

  if (!nom) return sendError(res, 400, 'Le nom du projet est obligatoire');

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({ nom, description, date_debut, date_fin, encadrant_id: req.user.id, statut: 'en_cours' })
    .select()
    .single();

  if (error) return sendError(res, 400, error.message);

  return res.status(201).json({ project: data });
}

// Détail d'un projet
export async function getProject(req, res) {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*, project_members(user_id)')
    .eq('id', id)
    .single();

  if (error || !data) return sendError(res, 404, 'Projet introuvable');

  return res.json({ project: data });
}

// Modifie un projet (ENCADRANT, TEAM_LEADER)
export async function updateProject(req, res) {
  const { id } = req.params;
  const { nom, description, date_debut, date_fin, statut } = req.body;

  const { data, error } = await supabaseAdmin
    .from('projects')
    .update({ nom, description, date_debut, date_fin, statut })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return sendError(res, 404, 'Projet introuvable');

  return res.json({ project: data });
}

// Supprime un projet (ENCADRANT uniquement)
export async function deleteProject(req, res) {
  const { id } = req.params;

  const { error } = await supabaseAdmin.from('projects').delete().eq('id', id);

  if (error) return sendError(res, 400, error.message);

  return res.status(204).send();
}

// Ajoute un membre à un projet via la table project_members
export async function addMember(req, res) {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) return sendError(res, 400, 'user_id est obligatoire');

  const { data, error } = await supabaseAdmin
    .from('project_members')
    .insert({ project_id: id, user_id })
    .select()
    .single();

  if (error) return sendError(res, 400, error.message);

  return res.status(201).json({ member: data });
}
