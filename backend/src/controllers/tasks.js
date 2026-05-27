import { supabaseAdmin } from '../config/supabase.js';
import { sendError, getPagination } from '../utils/index.js';
import { createNotification } from './notifications.js';

const VALID_STATUSES = ['a_faire', 'en_cours', 'termine', 'bloque'];

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

  // 🔔 Notification : notifier la personne assignée
  if (assignee_id && assignee_id !== req.user.id) {
    await createNotification(
      assignee_id,
      'tache_assignee',
      `Vous avez été assigné à la tâche "${titre}"`,
      project_id,
      data.id
    );
  }

  return res.status(201).json({ task: data });
}

export async function getTask(req, res) {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin.from('tasks').select('*').eq('id', id).single();
  if (error || !data) return sendError(res, 404, 'Tâche introuvable');
  return res.json({ task: data });
}

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

  // 🔔 Notification : notifier si statut changé
  if (statut && data.assignee_id) {
    await createNotification(
      data.assignee_id,
      'statut_tache',
      `La tâche "${data.titre}" est maintenant "${statut}"`,
      data.project_id,
      data.id
    );
  }

  return res.json({ task: data });
}

export async function deleteTask(req, res) {
  const { id } = req.params;
  const { error } = await supabaseAdmin.from('tasks').delete().eq('id', id);
  if (error) return sendError(res, 400, error.message);
  return res.status(204).send();
}

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

  // 🔔 Notification : notifier l'assigné du changement de statut
  if (data.assignee_id) {
    await createNotification(
      data.assignee_id,
      'statut_tache',
      `Le statut de votre tâche "${data.titre}" a changé : "${statut}"`,
      data.project_id,
      data.id
    );
  }

  return res.json({ task: data });
}