// Constantes de rôles — doivent correspondre aux user_metadata Supabase
export const ROLES = {
  ETUDIANT: 'etudiant',
  TEAM_LEADER: 'team_leader',
  ENCADRANT: 'encadrant',
  JURY: 'jury',
};

// Usine de middleware : requireRole('encadrant', 'jury') renvoie 403 si le rôle ne correspond pas
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé : rôle insuffisant' });
    }
    next();
  };
}
