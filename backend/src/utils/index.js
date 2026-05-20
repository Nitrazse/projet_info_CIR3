// Helpers partagés entre les contrôleurs

// Renvoie une réponse d'erreur formatée de façon uniforme
export function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

// Extrait les paramètres de pagination depuis la query string
export function getPagination(query) {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(parseInt(query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
