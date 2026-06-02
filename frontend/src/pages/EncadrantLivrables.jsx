import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './EncadrantLivrables.css';

const TYPE_LABEL = {
  'application/pdf':  'PDF',
  'image/png':        'Image',
  'image/jpeg':       'Image',
  'image/jpg':        'Image',
  'application/zip':  'Archive',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
};

const URGENCE_LABEL = { haute: 'Urgent', normale: 'Normal', basse: 'Faible' };

function getUrgence(livrable) {
  if (!livrable.created_at) return 'normale';
  const jours = Math.floor((Date.now() - new Date(livrable.created_at)) / (1000 * 60 * 60 * 24));
  if (jours >= 5) return 'haute';
  if (jours >= 2) return 'normale';
  return 'basse';
}

function getTypeLabel(type) {
  return TYPE_LABEL[type] ?? (type ? type.split('/')[1]?.toUpperCase() : 'Fichier');
}

// ── Aperçu rapide fichier ────────────────────────────────────────────────────
function FilePreview({ url, type, onClose }) {
  const isImage = type?.startsWith('image/');
  const isPdf   = type === 'application/pdf';

  return (
    <div className="elv-preview-overlay" onClick={onClose}>
      <div className="elv-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="elv-preview-modal__hd">
          <span className="elv-preview-modal__title">Aperçu</span>
          <button className="elv-preview-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="elv-preview-modal__body">
          {isImage && <img src={url} alt="Aperçu" className="elv-preview-img" />}
          {isPdf && <iframe src={url} title="PDF" className="elv-preview-pdf" />}
          {!isImage && !isPdf && (
            <div className="elv-preview-unsupported">
              <svg viewBox="0 0 20 20" fill="currentColor" width="40" height="40">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <p>Aperçu non disponible pour ce type de fichier.</p>
              <a href={url} target="_blank" rel="noreferrer" className="elv-btn elv-btn--ghost">
                Ouvrir dans un nouvel onglet
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modale validation / rejet ────────────────────────────────────────────────
function StatusModal({ livrable, action, onClose, onConfirm }) {
  const [comment, setComment]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');
  const isRejet = action === 'rejete';

  async function handleSubmit(e) {
    e.preventDefault();
    if (isRejet && !comment.trim()) {
      setErr('Un commentaire est obligatoire en cas de rejet.');
      return;
    }
    setSaving(true); setErr('');
    try {
      await onConfirm(livrable.id, action, comment.trim());
      onClose();
    } catch (error) {
      setErr(error?.response?.data?.error ?? 'Une erreur est survenue.');
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__hd">
          <h2 className="modal__title">
            {isRejet ? '❌ Rejeter' : '✅ Valider'} le livrable
          </h2>
          <button className="modal__close" onClick={onClose}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="elv-modal-info">
          <span className="elv-modal-info__nom">{livrable.nom}</span>
          <span className="elv-modal-info__version">v{livrable.version ?? 1}</span>
        </div>

        {err && <p className="modal__error">{err}</p>}

        <form onSubmit={handleSubmit} className="modal__form" noValidate>
          <div className="fld">
            <label className="fld__label" htmlFor="st-comment">
              Commentaire {isRejet ? <span className="elv-required">* obligatoire</span> : '(optionnel)'}
            </label>
            <textarea
              id="st-comment"
              className="fld__input fld__textarea"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder={isRejet
                ? 'Expliquez pourquoi ce livrable est rejeté…'
                : 'Ajoutez un commentaire de validation…'}
            />
          </div>
          <div className="modal__ft">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Annuler</button>
            <button
              type="submit"
              className={`btn ${isRejet ? 'btn--danger-solid' : 'btn--primary'}`}
              disabled={saving}
            >
              {saving ? 'Enregistrement…' : isRejet ? 'Rejeter' : 'Valider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

export default function EncadrantLivrables() {
  const [projects, setProjects]       = useState([]);
  const [livrables, setLivrables]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  // Filtres
  const [filtreProjet, setFiltreProjet] = useState('');
  const [filtreType, setFiltreType]     = useState('');
  const [filtreUrgence, setFiltreUrgence] = useState('');

  // Pagination
  const [page, setPage] = useState(1);

  // Modales
  const [statusModal, setStatusModal]   = useState(null); // { livrable, action }
  const [previewData, setPreviewData]   = useState(null); // { url, type }
  const [previewLoading, setPreviewLoading] = useState(null); // livrable id

  useEffect(() => {
    api.get('/projects?limit=100')
      .then(r => setProjects(r.data.projects ?? []))
      .catch(() => {});
  }, []);

  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError('');
    const params = filtreProjet ? `?project_id=${filtreProjet}` : '';
    api.get(`/deliverables/pending${params}`)
      .then(({ data }) => { if (alive) setLivrables(data.deliverables ?? []); })
      .catch(() => { if (alive) setError('Impossible de charger les livrables.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [filtreProjet, refresh]);

  // Aperçu fichier
  async function handlePreview(livrable) {
    setPreviewLoading(livrable.id);
    try {
      const { data } = await api.get(`/deliverables/${livrable.id}`);
      if (data.url) setPreviewData({ url: data.url, type: livrable.type_fichier });
      else alert('Fichier indisponible.');
    } catch {
      alert('Impossible de récupérer le fichier.');
    } finally {
      setPreviewLoading(null);
    }
  }

  // Validation / rejet avec mise à jour optimiste
  const handleConfirm = useCallback(async (id, statut, commentaire) => {
    // Mise à jour optimiste immédiate
    setLivrables(prev => prev.filter(l => l.id !== id));
    await api.patch(`/deliverables/${id}/status`, { statut, commentaire: commentaire || undefined });
  }, []);

  // Filtres appliqués côté client
  const filtered = livrables.filter(l => {
    if (filtreType && getTypeLabel(l.type_fichier) !== filtreType) return false;
    if (filtreUrgence && getUrgence(l) !== filtreUrgence) return false;
    return true;
  });

  // Types disponibles
  const typesDispos = [...new Set(livrables.map(l => getTypeLabel(l.type_fichier)))];

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="elv-page">
      {/* En-tête */}
      <div className="page-hd">
        <div>
          <h1 className="page-hd__title">Livrables en attente</h1>
          <p className="page-hd__sub">
            {loading ? '…' : `${filtered.length} livrable${filtered.length > 1 ? 's' : ''} à valider`}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="elv-filters">
        <select
          className="elv-filter"
          value={filtreProjet}
          onChange={e => { setFiltreProjet(e.target.value); setPage(1); }}
        >
          <option value="">Tous les projets</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>

        <select
          className="elv-filter"
          value={filtreType}
          onChange={e => { setFiltreType(e.target.value); setPage(1); }}
        >
          <option value="">Tous les types</option>
          {typesDispos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          className="elv-filter"
          value={filtreUrgence}
          onChange={e => { setFiltreUrgence(e.target.value); setPage(1); }}
        >
          <option value="">Toute urgence</option>
          <option value="haute">🔴 Urgent</option>
          <option value="normale">🟡 Normal</option>
          <option value="basse">🟢 Faible</option>
        </select>

        {(filtreProjet || filtreType || filtreUrgence) && (
          <button
            className="elv-filter-reset"
            onClick={() => { setFiltreProjet(''); setFiltreType(''); setFiltreUrgence(''); setPage(1); }}
          >
            Réinitialiser
          </button>
        )}
      </div>

      {error && <p className="page-error">{error}</p>}

      {loading ? (
        <div className="page-loading">Chargement…</div>
      ) : paginated.length === 0 ? (
        <div className="page-empty">
          <svg viewBox="0 0 20 20" fill="currentColor" width="40" height="40" style={{ color: '#94a3b8' }}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p>Aucun livrable en attente de validation.</p>
        </div>
      ) : (
        <>
          <div className="elv-list">
            {paginated.map(l => {
              const urgence = getUrgence(l);
              const jours   = Math.floor((Date.now() - new Date(l.created_at)) / (1000 * 60 * 60 * 24));
              return (
                <div key={l.id} className={`elv-card elv-card--${urgence}`}>
                  {/* Indicateur urgence */}
                  <div className={`elv-card__urgence elv-card__urgence--${urgence}`} title={URGENCE_LABEL[urgence]} />

                  <div className="elv-card__main">
                    <div className="elv-card__hd">
                      <div className="elv-card__info">
                        {/* Icône type fichier */}
                        <div className="elv-card__file-icon">
                          {l.type_fichier?.startsWith('image/') ? '🖼' : l.type_fichier === 'application/pdf' ? '📄' : '📁'}
                        </div>
                        <div>
                          <p className="elv-card__nom">{l.nom}</p>
                          <div className="elv-card__meta">
                            <span className="elv-tag">{getTypeLabel(l.type_fichier)}</span>
                            <span className="elv-tag">v{l.version ?? 1}</span>
                            {l.projects?.nom && <span className="elv-tag elv-tag--blue">{l.projects.nom}</span>}
                            <span className={`elv-tag elv-tag--${urgence}`}>
                              {jours === 0 ? "Aujourd'hui" : `Il y a ${jours}j`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="elv-card__actions">
                        <button
                          className="elv-btn elv-btn--ghost"
                          onClick={() => handlePreview(l)}
                          disabled={previewLoading === l.id}
                        >
                          {previewLoading === l.id ? '…' : '👁 Aperçu'}
                        </button>
                        <button
                          className="elv-btn elv-btn--green"
                          onClick={() => setStatusModal({ livrable: l, action: 'valide' })}
                        >
                          ✓ Valider
                        </button>
                        <button
                          className="elv-btn elv-btn--red"
                          onClick={() => setStatusModal({ livrable: l, action: 'rejete' })}
                        >
                          ✕ Rejeter
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="elv-pagination">
              <button
                className="elv-page-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Précédent
              </button>
              <span className="elv-page-info">Page {page} / {totalPages}</span>
              <button
                className="elv-page-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Suivant →
              </button>
            </div>
          )}
        </>
      )}

      {/* Modale validation/rejet */}
      {statusModal && (
        <StatusModal
          livrable={statusModal.livrable}
          action={statusModal.action}
          onClose={() => setStatusModal(null)}
          onConfirm={handleConfirm}
        />
      )}

      {/* Aperçu fichier */}
      {previewData && (
        <FilePreview
          url={previewData.url}
          type={previewData.type}
          onClose={() => setPreviewData(null)}
        />
      )}
    </div>
  );
}
