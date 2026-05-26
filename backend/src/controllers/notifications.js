import { supabaseAdmin } from '../config/supabase.js';
import { sendError, getPagination } from '../utils/index.js';

// Liste les notifications de l'utilisateur connecté
export async function listNotifications(req, res) {
  const { page, limit, offset } = getPagination(req.query);
  const { data, error, count } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('destinataire_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) return sendError(res, 500, error.message);
  return res.json({ notifications: data, total: count, page, limit });
}

// Marque une notification comme lue
export async function markAsRead(req, res) {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .update({ lu: true })
    .eq('id', id)
    .eq('destinataire_id', req.user.id)
    .select()
    .single();
  if (error || !data) return sendError(res, 404, 'Notification introuvable');
  return res.json({ notification: data });
}

// Marque toutes les notifications comme lues
export async function markAllAsRead(req, res) {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ lu: true })
    .eq('destinataire_id', req.user.id)
    .eq('lu', false);
  if (error) return sendError(res, 500, error.message);
  return res.json({ message: 'Toutes les notifications marquées comme lues' });
}

// Crée une notification (appelé en interne par les autres modules)
export async function createNotification(destinataire_id, type, message, project_id = null, task_id = null) {
  const { error } = await supabaseAdmin
    .from('notifications')
    .insert({ destinataire_id, type, message, project_id, task_id });
  if (error) console.error('Erreur notification:', error.message);
}