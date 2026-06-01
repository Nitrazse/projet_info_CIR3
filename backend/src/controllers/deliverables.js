import { supabaseAdmin } from '../config/supabase.js';
import { sendError, getPagination } from '../utils/index.js';

const BUCKET = 'deliverables';
const VALID_STATUSES = ['soumis', 'valide', 'rejete'];

// Nettoie le nom de fichier pour le chemin Supabase Storage
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

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

// Reçoit le fichier (multipart/form-data), l'envoie dans Supabase Storage, enregistre en base
export async function uploadDeliverable(req, res) {
  if (!req.file) return sendError(res, 400, 'Aucun fichier reçu');

  const { project_id, nom } = req.body;
  if (!project_id) return sendError(res, 400, 'project_id est obligatoire');

  const timestamp = Date.now();
  const safeName = sanitizeFilename(req.file.originalname);
  const storagePath = `projects/${project_id}/${timestamp}-${safeName}`;

  // Upload vers Supabase Storage (cloud)
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });

  if (uploadError) return sendError(res, 500, `Erreur upload Storage : ${uploadError.message}`);

  // Enregistre les métadonnées en base
  const { data, error } = await supabaseAdmin
    .from('deliverables')
    .insert({
      project_id,
      nom: nom || req.file.originalname,
      storage_path: storagePath,
      type_fichier: req.file.mimetype,
      taille_octets: req.file.size,
      deposant_id: req.user.id,
      statut: 'soumis',
    })
    .select()
    .single();

  if (error) {
    // Rollback : supprime le fichier du Storage si l'insert échoue
    await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
    return sendError(res, 400, error.message);
  }

  return res.status(201).json({ deliverable: data });
}

// Retourne le détail d'un livrable avec une URL signée sécurisée (valable 1h)
export async function getDeliverable(req, res) {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('deliverables')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return sendError(res, 404, 'Livrable introuvable');

  const { data: signed, error: urlError } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(data.storage_path, 3600);

  if (urlError) return sendError(res, 500, 'Impossible de générer l\'URL de téléchargement');

  return res.json({ deliverable: data, download_url: signed.signedUrl });
}

// Valide ou rejette un livrable — met à jour le statut + qui a validé + quand (ENCADRANT, JURY)
export async function updateDeliverableStatus(req, res) {
  const { id } = req.params;
  const { statut, commentaire } = req.body;

  if (!statut) return sendError(res, 400, 'statut est obligatoire');
  if (!VALID_STATUSES.includes(statut)) {
    return sendError(res, 400, `Statut invalide. Valeurs acceptées : ${VALID_STATUSES.join(', ')}`);
  }

  const { data, error } = await supabaseAdmin
    .from('deliverables')
    .update({
      statut,
      commentaire_validation: commentaire ?? null,
      validateur_id: req.user.id,
      validated_at: new Date().toISOString(),
    })
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
  await supabaseAdmin.storage.from(BUCKET).remove([data.storage_path]);

  const { error } = await supabaseAdmin.from('deliverables').delete().eq('id', id);

  if (error) return sendError(res, 400, error.message);

  return res.status(204).send();
}
