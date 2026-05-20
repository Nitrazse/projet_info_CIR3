// Fonctions utilitaires partagées (formatage de dates, validation, etc.)

/**
 * Formate une date ISO en date lisible (ex: "20 mai 2026")
 * @param {string} isoDate
 * @returns {string}
 */
export function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
