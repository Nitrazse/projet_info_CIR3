import { supabaseAdmin } from '../config/supabase.js';
import { sendError, getPagination } from '../utils/index.js';
import { createNotification } from './notifications.js';

const VALID_STATUSES = ['soumis', 'valide', 'rejete'];

export async function listDeliverables(req, res) {
  const { page, limit, offset } = getPagination(req.query);
  const { project_id, statut } = req.query;

  if (!project_id) return sendError(res, 400, 'project_id est requis');

  let query = supabaseAdmin
    .from('deliverables')
    .select('*', { count: 'exact' })
    .eq('project_id', project_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (statut) query = query.eq('statut', statut);

  const { data, error, count } = await query;

  if (error) return sendError(res, 500, error.message);

  return res.json({ deliverables: data, total: count, page, limit });
}

export async function listPendingDeliverables(req, res) {
  const { page, limit, offset } = getPagination(req.query);
  const { project_id } = req.query;

  let query = supabaseAdmin
    .from('deliverables')
    .select('*, projects(nom, encadrant_id)', { count: 'exact' })
    .eq('statut', 'soumis')
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (project_id) query = query.eq('project_id', project_id);

  if (req.user.role === 'encadrant') {
    query = query.eq('projects.encadrant_id', req.user.id);
  }

  const { data, error, count } = await query;

  if (error) return sendError(res, 500, error.message);

  return res.json({ deliverables: data, total: count, page, limit });
}

export async function uploadDeliverable(req, res) {
  const { project_id, nom, storage_path, type_fichier, livrable_parent_id } = req.body;
  if (!project_id) return sendError(res, 400, 'project_id est obligatoire');

  let version = 1;

  if (livrable_parent_id) {
    const { data: parent, error: parentError } = await supabaseAdmin
      .from('deliverables')
      .select('version, nom, project_id')
      .eq('id', livrable_parent_id)
      .single();

    if (parentError || !parent) return sendError(res, 404, 'Livrable parent introuvable');
    if (parent.project_id !== project_id)
      return sendError(res, 400, 'Le livrable parent appartient à un autre projet');

    version = parent.version + 1;
  } else {
    const { data: existing } = await supabaseAdmin
      .from('deliverables')
      .select('version')
      .eq('project_id', project_id)
      .eq('nom', nom)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) version = existing.version + 1;
  }

  const { data, error } = await supabaseAdmin
    .from('deliverables')
    .insert({
      project_id,
      nom,
      storage_path,
      type_fichier,
      deposant_id: req.user.id,
      statut: 'soumis',
      version,
      livrable_parent_id: livrable_parent_id ?? null,
    })
    .select()
    .single();

  if (error) return sendError(res, 400, error.message);

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('encadrant_id, nom')
    .eq('id', project_id)
    .single();

  if (project?.encadrant_id) {
    const versionLabel = version > 1 ? ` (v${version})` : '';
    await createNotification(
      project.encadrant_id,
      'livrable_soumis',
      `Nouveau livrable soumis${versionLabel} : "${nom}" sur le projet "${project.nom}"`,
      project_id
    );
  }

  return res.status(201).json({ deliverable: data });
}

export async function getDeliverable(req, res) {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('deliverables')
    .select('*, projects(nom)')
    .eq('id', id)
    .single();

  if (error || !data) return sendError(res, 404, 'Livrable introuvable');

  const { data: signedUrl } = await supabaseAdmin.storage
    .from('deliverables')
    .createSignedUrl(data.storage_path, 3600);

  const { data: versions } = await supabaseAdmin
    .from('deliverables')
    .select('id, version, statut, created_at, deposant_id')
    .eq('project_id', data.project_id)
    .eq('nom', data.nom)
    .order('version', { ascending: false });

  return res.json({ deliverable: data, url: signedUrl?.signedUrl ?? null, versions: versions ?? [] });
}

export async function updateDeliverableStatus(req, res) {
  const { id } = req.params;
  const { statut, commentaire } = req.body;

  if (!statut) return sendError(res, 400, 'statut est obligatoire');
  if (!VALID_STATUSES.includes(statut)) {
    return sendError(res, 400, `Statut invalide. Valeurs acceptées : ${VALID_STATUSES.join(', ')}`);
  }
  if (statut === 'soumis') return sendError(res, 400, 'Impossible de repasser un livrable à "soumis"');

  const { data, error } = await supabaseAdmin
    .from('deliverables')
    .update({
      statut,
      commentaire_validation: commentaire ?? null,
      valide_par: req.user.id,
      valide_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, projects(nom)')
    .single();

  if (error || !data) return sendError(res, 404, 'Livrable introuvable');

  if (data.deposant_id) {
    const action = statut === 'valide' ? 'validé' : 'rejeté';
    const commentaireNote = commentaire ? ` — Commentaire : "${commentaire}"` : '';
    await createNotification(
      data.deposant_id,
      'livrable_statue',
      `Votre livrable "${data.nom}" (v${data.version}) a été ${action} sur le projet "${data.projects?.nom}"${commentaireNote}`,
      data.project_id
    );
  }

  return res.json({ deliverable: data });
}

export async function deleteDeliverable(req, res) {
  const { id } = req.params;

  const { data, error: fetchError } = await supabaseAdmin
    .from('deliverables')
    .select('storage_path, deposant_id, statut')
    .eq('id', id)
    .single();

  if (fetchError || !data) return sendError(res, 404, 'Livrable introuvable');

  if (data.deposant_id !== req.user.id && req.user.role !== 'encadrant') {
    return sendError(res, 403, 'Vous ne pouvez supprimer que vos propres livrables');
  }

  if (data.statut === 'valide' && req.user.role !== 'encadrant') {
    return sendError(res, 403, "Un livrable validé ne peut être supprimé que par l'encadrant");
  }

  await supabaseAdmin.storage.from('deliverables').remove([data.storage_path]);

  const { error } = await supabaseAdmin.from('deliverables').delete().eq('id', id);

  if (error) return sendError(res, 400, error.message);

  return res.status(204).send();
}
