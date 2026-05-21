import { supabaseAdmin } from '../config/supabase.js';
import { sendError, getPagination } from '../utils/index.js';

const VALID_STATUSES = ['a_faire', 'en_cours', 'termine', 'bloque'];

// Liste les tâches avec filtres optionnels (projectId, assigneeId, statut)
export async function listTasks(req, res) {
  const { page, limit, offset } = getPagination(req.query);
  const { project_id, assignee_id, statut } = req.query;

  let query = supabaseAdmin.from('tasks').select('*', { count: 'exact' });

  if (project_id) query = query.eq('project_id', project_id);
  if (assignee_id) query = query.eq('assignee_id', assignee_id);
  if (statut) query = query.eq('statut', statut);

  const { data, error, count } = await query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

  if (error) return sendError(res, 500, error.message);

  return res.json({ tasks: data, total: count, page, limit });
}

// Crée une tâche dans un projet
export async function createTask(req, res) {
  const { project_id, titre, description, assignee_id, date_echeance } = req.body;

  if (!project_id || !titre) {
    return sendError(res, 400, 'project_id et titre sont obligatoires');
  }

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .insert({ project_id, titre, description, assignee_id, date_echeance, statut: 'a_faire', createur_id: req.user.id })
    .select()
    .single();

  if (error) return sendError(res, 400, error.message);

  return res.status(201).json({ task: data });
}

// Détail d'une tâche
export async function getTask(req, res) {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin.from('tasks').select('*').eq('id', id).single();

  if (error || !data) return sendError(res, 404, 'Tâche introuvable');

  return res.json({ task: data });
}

// Met à jour une tâche
export async function updateTask(req, res) {
  const { id } = req.params;
  const { titre, description, assignee_id, date_echeance, statut } = req.body;

  if (statut && !VALID_STATUSES.includes(statut)) {
    return sendError(res, 400, `Statut invalide. Valeurs acceptées : ${VALID_STATUSES.join(', ')}`);
  }

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .update({ titre, description, assignee_id, date_echeance, statut })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return sendError(res, 404, 'Tâche introuvable');

  return res.json({ task: data });
}

// Supprime une tâche
export async function deleteTask(req, res) {
  const { id } = req.params;

  const { error } = await supabaseAdmin.from('tasks').delete().eq('id', id);

  if (error) return sendError(res, 400, error.message);

  return res.status(204).send();
}

// Change uniquement le statut — pour le drag & drop Kanban
export async function updateTaskStatus(req, res) {
  const { id } = req.params;
  const { statut } = req.body;

  if (!statut) return sendError(res, 400, 'statut est obligatoire');
  if (!VALID_STATUSES.includes(statut)) {
    return sendError(res, 400, `Statut invalide. Valeurs acceptées : ${VALID_STATUSES.join(', ')}`);
  }

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .update({ statut })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return sendError(res, 404, 'Tâche introuvable');

  return res.json({ task: data });
}
