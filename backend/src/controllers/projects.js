import { supabaseAdmin } from '../config/supabase.js';
import { sendError, getPagination } from '../utils/index.js';
import { createNotification } from './notifications.js';

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

// Détail complet d'un projet — membres, tâches, livrables, évaluations, avancement, feedbacks
export async function getProject(req, res) {
  const { id } = req.params;

  const [
    { data: project, error: projectError },
    { data: members },
    { data: tasks },
    { data: deliverables },
    { data: evaluations },
    { data: feedbacks },
  ] = await Promise.all([
    supabaseAdmin.from('projects').select('*').eq('id', id).single(),
    supabaseAdmin.from('project_members').select('user_id, role, joined_at').eq('project_id', id),
    supabaseAdmin.from('tasks').select('id, titre, statut, assignee_id, date_echeance').eq('project_id', id),
    supabaseAdmin.from('deliverables').select('id, nom, statut, version, created_at').eq('project_id', id).order('created_at', { ascending: false }),
    supabaseAdmin.from('evaluations').select('id, note, statut, evaluateur_id, created_at').eq('project_id', id),
    supabaseAdmin.from('project_feedbacks').select('*').eq('project_id', id).order('created_at', { ascending: false }),
  ]);

  if (projectError || !project) return sendError(res, 404, 'Projet introuvable');

  // Calcul avancement tâches
  const total = tasks?.length ?? 0;
  const terminees = tasks?.filter(t => t.statut === 'termine').length ?? 0;
  const avancement = total > 0 ? Math.round((terminees / total) * 100) : 0;

  // Marque les éléments comme consultés par cet utilisateur (encadrant)
  if (req.user.role === 'encadrant') {
    await supabaseAdmin
      .from('project_views')
      .upsert({ project_id: id, user_id: req.user.id, last_viewed_at: new Date().toISOString() }, { onConflict: 'project_id,user_id' });
  }

  return res.json({
    project: {
      ...project,
      membres: members ?? [],
      taches: tasks ?? [],
      livrables: deliverables ?? [],
      evaluations: evaluations ?? [],
      feedbacks: feedbacks ?? [],
      avancement,
      stats: {
        total_taches: total,
        taches_terminees: terminees,
        taches_en_cours: tasks?.filter(t => t.statut === 'en_cours').length ?? 0,
        taches_bloquees: tasks?.filter(t => t.statut === 'bloque').length ?? 0,
        livrables_en_attente: deliverables?.filter(d => d.statut === 'soumis').length ?? 0,
        livrables_valides: deliverables?.filter(d => d.statut === 'valide').length ?? 0,
        note_moyenne: evaluations?.length
          ? Math.round((evaluations.reduce((s, e) => s + (e.note ?? 0), 0) / evaluations.length) * 100) / 100
          : null,
      },
    },
  });
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
  const { user_id, role } = req.body;

  if (!user_id) return sendError(res, 400, 'user_id est obligatoire');

  const { data, error } = await supabaseAdmin
    .from('project_members')
    .insert({ project_id: id, user_id, role: role ?? 'etudiant' })
    .select()
    .single();

  if (error) return sendError(res, 400, error.message);

  return res.status(201).json({ member: data });
}

// ─── FEEDBACKS ENCADRANT ─────────────────────────────────────────────────────

// Liste les feedbacks d'un projet
export async function listFeedbacks(req, res) {
  const { id } = req.params;
  const { page, limit, offset } = getPagination(req.query);

  const { data, error, count } = await supabaseAdmin
    .from('project_feedbacks')
    .select('*', { count: 'exact' })
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return sendError(res, 500, error.message);
  return res.json({ feedbacks: data, total: count, page, limit });
}

// Ajoute un feedback encadrant sur un projet
export async function addFeedback(req, res) {
  const { id } = req.params;
  const { contenu, type } = req.body;

  if (!contenu) return sendError(res, 400, 'Le contenu du feedback est obligatoire');

  const VALID_TYPES = ['general', 'livrable', 'avancement', 'alerte'];
  if (type && !VALID_TYPES.includes(type)) {
    return sendError(res, 400, `Type invalide. Valeurs acceptées : ${VALID_TYPES.join(', ')}`);
  }

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('nom')
    .eq('id', id)
    .single();

  if (!project) return sendError(res, 404, 'Projet introuvable');

  const { data, error } = await supabaseAdmin
    .from('project_feedbacks')
    .insert({ project_id: id, auteur_id: req.user.id, contenu, type: type ?? 'general' })
    .select()
    .single();

  if (error) return sendError(res, 400, error.message);

  // Notifie le team_leader du projet
  const { data: leaders } = await supabaseAdmin
    .from('project_members')
    .select('user_id')
    .eq('project_id', id)
    .eq('role', 'team_leader');

  for (const leader of leaders ?? []) {
    await createNotification(
      leader.user_id,
      'feedback_encadrant',
      `Nouveau feedback de votre encadrant sur le projet "${project.nom}"`,
      id
    );
  }

  return res.status(201).json({ feedback: data });
}

// Modifie un feedback (auteur uniquement)
export async function updateFeedback(req, res) {
  const { feedbackId } = req.params;
  const { contenu, type } = req.body;

  const { data: existing } = await supabaseAdmin
    .from('project_feedbacks')
    .select('auteur_id')
    .eq('id', feedbackId)
    .single();

  if (!existing) return sendError(res, 404, 'Feedback introuvable');
  if (existing.auteur_id !== req.user.id) return sendError(res, 403, 'Vous ne pouvez modifier que vos propres feedbacks');

  const { data, error } = await supabaseAdmin
    .from('project_feedbacks')
    .update({ contenu, type })
    .eq('id', feedbackId)
    .select()
    .single();

  if (error) return sendError(res, 400, error.message);
  return res.json({ feedback: data });
}

// Supprime un feedback (auteur uniquement)
export async function deleteFeedback(req, res) {
  const { feedbackId } = req.params;

  const { data: existing } = await supabaseAdmin
    .from('project_feedbacks')
    .select('auteur_id')
    .eq('id', feedbackId)
    .single();

  if (!existing) return sendError(res, 404, 'Feedback introuvable');
  if (existing.auteur_id !== req.user.id) return sendError(res, 403, 'Vous ne pouvez supprimer que vos propres feedbacks');

  const { error } = await supabaseAdmin.from('project_feedbacks').delete().eq('id', feedbackId);
  if (error) return sendError(res, 400, error.message);
  return res.status(204).send();
}

// ─── TRACKING ÉLÉMENTS NON CONSULTÉS ─────────────────────────────────────────

// Retourne les éléments non consultés depuis la dernière visite de l'encadrant
export async function getUnseenElements(req, res) {
  const { id } = req.params;

  // Récupère la dernière date de visite
  const { data: view } = await supabaseAdmin
    .from('project_views')
    .select('last_viewed_at')
    .eq('project_id', id)
    .eq('user_id', req.user.id)
    .single();

  const since = view?.last_viewed_at ?? new Date(0).toISOString();

  const [
    { data: newTasks },
    { data: newDeliverables },
    { data: newComments },
  ] = await Promise.all([
    supabaseAdmin.from('tasks').select('id, titre, statut, created_at').eq('project_id', id).gt('created_at', since),
    supabaseAdmin.from('deliverables').select('id, nom, statut, version, created_at').eq('project_id', id).gt('created_at', since),
    supabaseAdmin.from('comments').select('id, contenu, auteur_id, created_at').eq('project_id', id).gt('created_at', since),
  ]);

  const total =
    (newTasks?.length ?? 0) +
    (newDeliverables?.length ?? 0) +
    (newComments?.length ?? 0);

  return res.json({
    unseen: {
      total,
      since,
      taches: newTasks ?? [],
      livrables: newDeliverables ?? [],
      commentaires: newComments ?? [],
    },
  });
}
