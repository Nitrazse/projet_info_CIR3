import { supabaseAdmin } from '../config/supabase.js';
import { sendError, getPagination } from '../utils/index.js';

const VALID_STATUSES = ['soumis', 'valide', 'rejete'];

// Liste les livrables d'un projet
export async function listDeliverables(req, res) {
  const { page, limit, offset } = getPagination(req.query);
  const { project_id } = req.query;

  if (!project_id) return sendError(res, 400, 'project_id est requis');

  const { data, error, count } = await supabaseAdmin
    .from('deliverables')
    .select('*', { count: 'exact' })
    .eq('project_id', project_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return sendError(res, 500, error.message);

  return res.json({ deliverables: data, total: count, page, limit });
}

// Enregistre un livrable — le client uploade directement dans Supabase Storage
// et envoie l'URL publique ou le chemin storage_path
export async function uploadDeliverable(req, res) {
  const { project_id, nom, storage_path, type_fichier } = req.body;

  if (!project_id || !nom || !storage_path) {
    return sendError(res, 400, 'project_id, nom et storage_path sont obligatoires');
  }

  const { data, error } = await supabaseAdmin
    .from('deliverables')
    .insert({ project_id, nom, storage_path, type_fichier, deposant_id: req.user.id, statut: 'soumis' })
    .select()
    .single();

  if (error) return sendError(res, 400, error.message);

  return res.status(201).json({ deliverable: data });
}

// Retourne le détail d'un livrable avec une URL signée (valable 1h)
export async function getDeliverable(req, res) {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin.from('deliverables').select('*').eq('id', id).single();

  if (error || !data) return sendError(res, 404, 'Livrable introuvable');

  // Génère une URL signée depuis Supabase Storage
  const { data: signedUrl, error: urlError } = await supabaseAdmin.storage
    .from('deliverables')
    .createSignedUrl(data.storage_path, 3600);

  return res.json({ deliverable: data, url: signedUrl?.signedUrl ?? null });
}

// Valide ou rejette un livrable (ENCADRANT, JURY)
export async function updateDeliverableStatus(req, res) {
  const { id } = req.params;
  const { statut, commentaire } = req.body;

  if (!statut) return sendError(res, 400, 'statut est obligatoire');
  if (!VALID_STATUSES.includes(statut)) {
    return sendError(res, 400, `Statut invalide. Valeurs acceptées : ${VALID_STATUSES.join(', ')}`);
  }

  const { data, error } = await supabaseAdmin
    .from('deliverables')
    .update({ statut, commentaire_validation: commentaire })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return sendError(res, 404, 'Livrable introuvable');

  return res.json({ deliverable: data });
}

// Supprime un livrable et son fichier dans Supabase Storage
export async function deleteDeliverable(req, res) {
  const { id } = req.params;

  const { data, error: fetchError } = await supabaseAdmin
    .from('deliverables')
    .select('storage_path, deposant_id')
    .eq('id', id)
    .single();

  if (fetchError || !data) return sendError(res, 404, 'Livrable introuvable');

  if (data.deposant_id !== req.user.id && req.user.role !== 'encadrant') {
    return sendError(res, 403, 'Vous ne pouvez supprimer que vos propres livrables');
  }

  // Supprime le fichier du bucket Storage
  await supabaseAdmin.storage.from('deliverables').remove([data.storage_path]);

  const { error } = await supabaseAdmin.from('deliverables').delete().eq('id', id);

  if (error) return sendError(res, 400, error.message);

  return res.status(204).send();
}
