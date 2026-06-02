import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import supabase from '../services/supabase';
import './Deliverables.css';

const STATUS_LABEL = { soumis: 'Soumis', valide: 'Validé', rejete: 'Rejeté' };

export default function Deliverables() {
  const { hasRole, user } = useAuth();
  const canValidate = hasRole('encadrant', 'jury');

  const [projects, setProjects]       = useState([]);
  const [projectId, setProjectId]     = useState('');
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  /* ── Upload ── */
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadNom, setUploadNom]     = useState('');
  const [uploadFile, setUploadFile]   = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [uploadErr, setUploadErr]     = useState('');
  const fileRef = useRef(null);

  /* ── Validate / reject modal ── */
  const [statusModal, setStatusModal] = useState(null); // { deliverable, action }
  const [comment, setComment]         = useState('');
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusErr, setStatusErr]     = useState('');

  useEffect(() => {
    api.get('/projects?limit=100').then(r => {
      const ps = r.data.projects ?? [];
      setProjects(ps);
      if (ps.length > 0) setProjectId(String(ps[0].id));
    }).catch(() => {});
  }, []);

  const [refresh, setRefresh] = useState(0);
  function reload() { setRefresh(r => r + 1); }

  useEffect(() => {
    if (!projectId) return;
    let alive = true;
    setLoading(true);
    setError('');
    api.get(`/deliverables?project_id=${projectId}&limit=100`)
      .then(({ data }) => { if (alive) setDeliverables(data.deliverables ?? []); })
      .catch(() => { if (alive) setError('Impossible de charger les livrables.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [projectId, refresh]);

  /* ── Upload to Supabase Storage then register ── */
  async function handleUpload(e) {
    e.preventDefault();
    if (!uploadFile) { setUploadErr('Sélectionnez un fichier.'); return; }
    if (!uploadNom.trim()) { setUploadErr('Le nom est requis.'); return; }

    setUploading(true);
    setUploadErr('');
    const storagePath = `project_${projectId}/${Date.now()}_${uploadFile.name}`;

    try {
      const { error: storErr } = await supabase.storage
        .from('deliverables')
        .upload(storagePath, uploadFile, { upsert: false });

      if (storErr) throw new Error(storErr.message);

      await api.post('/deliverables', {
        project_id:   projectId,
        nom:          uploadNom.trim(),
        storage_path: storagePath,
        type_fichier: uploadFile.type || 'application/octet-stream',
      });

      setUploadModal(false);
      setUploadNom('');
      setUploadFile(null);
      reload();
    } catch (err) {
      setUploadErr(err.message ?? 'Erreur lors du dépôt.');
    } finally {
      setUploading(false);
    }
  }

  /* ── Download: get signed URL ── */
  async function handleDownload(d) {
    try {
      const { data } = await api.get(`/deliverables/${d.id}`);
      if (data.url) window.open(data.url, '_blank');
      else alert('URL indisponible.');
    } catch {
      alert('Impossible de récupérer le fichier.');
    }
  }

  /* ── Validate / reject ── */
  function openStatus(deliverable, action) {
    setStatusModal({ deliverable, action });
    setComment('');
    setStatusErr('');
  }

  async function handleStatusUpdate(e) {
    e.preventDefault();
    setStatusSaving(true);
    setStatusErr('');
    try {
      await api.patch(`/deliverables/${statusModal.deliverable.id}/status`, {
        statut: statusModal.action,
        commentaire: comment.trim() || undefined,
      });
      setStatusModal(null);
      reload();
    } catch (err) {
      setStatusErr(err.response?.data?.error ?? 'Une erreur est survenue.');
    } finally {
      setStatusSaving(false);
    }
  }

  /* ── Delete ── */
  async function handleDelete(d) {
    if (!window.confirm(`Supprimer le livrable "${d.nom}" ?`)) return;
    try {
      await api.delete(`/deliverables/${d.id}`);
      reload();
    } catch {
      alert('Impossible de supprimer ce livrable.');
    }
  }

  return (
    <div className="deliv-page">
      <div className="page-hd">
        <div>
          <h1 className="page-hd__title">Livrables</h1>
          <p className="page-hd__sub">Déposez et suivez les livrables de vos projets</p>
        </div>
        {projectId && !['cloture', 'soutenu'].includes(projects.find(p => p.id === projectId)?.statut) && (
          <button className="btn btn--primary" onClick={() => { setUploadModal(true); setUploadErr(''); setUploadNom(''); setUploadFile(null); }}>
            Déposer un livrable
          </button>
        )}
        {projectId && ['cloture', 'soutenu'].includes(projects.find(p => p.id === projectId)?.statut) && (
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>🔒 Projet clôturé — dépôt désactivé</span>
        )}
      </div>

      <div className="tasks-selector">
        <label className="fld__label" htmlFor="d-project">Projet</label>
        <select
          id="d-project"
          className="fld__input tasks-select"
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
        >
          <option value="">-- Sélectionner un projet --</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
      </div>

      {error && <p className="page-error">{error}</p>}

      {!projectId ? (
        <div className="page-empty"><p>Sélectionnez un projet pour voir ses livrables.</p></div>
      ) : loading ? (
        <div className="page-loading">Chargement…</div>
      ) : deliverables.length === 0 ? (
        <div className="page-empty">
          <p>Aucun livrable pour ce projet.</p>
          <button className="btn btn--primary" onClick={() => setUploadModal(true)}>
            Déposer le premier livrable
          </button>
        </div>
      ) : (
        <div className="deliv-list">
          {deliverables.map(d => (
            <div key={d.id} className="deliv-card">
              <div className="deliv-card__hd">
                <div className="deliv-card__info">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20" className="deliv-card__icon">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="deliv-card__name">{d.nom}</p>
                    <p className="deliv-card__meta">
                      {d.type_fichier && <span>{d.type_fichier}</span>}
                      {d.created_at && (
                        <span>{new Date(d.created_at).toLocaleDateString('fr-FR')}</span>
                      )}
                    </p>
                  </div>
                </div>
                <span className={`status-badge status-badge--${d.statut}`}>
                  {STATUS_LABEL[d.statut] ?? d.statut}
                </span>
              </div>

              {d.commentaire_validation && (
                <p className="deliv-card__comment">
                  Commentaire : {d.commentaire_validation}
                </p>
              )}

              <div className="deliv-card__actions">
                <button className="btn-sm btn-sm--ghost" onClick={() => handleDownload(d)}>
                  Télécharger
                </button>
                {canValidate && d.statut === 'soumis' && (
                  <>
                    <button className="btn-sm btn-sm--green" onClick={() => openStatus(d, 'valide')}>
                      Valider
                    </button>
                    <button className="btn-sm btn-sm--danger" onClick={() => openStatus(d, 'rejete')}>
                      Rejeter
                    </button>
                  </>
                )}
                {(d.deposant_id === user?.id || hasRole('encadrant')) && (
                  <button className="btn-sm btn-sm--danger" onClick={() => handleDelete(d)}>
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Upload modal ── */}
      {uploadModal && (
        <div className="modal-overlay" onClick={() => setUploadModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__hd">
              <h2 className="modal__title">Déposer un livrable</h2>
              <button className="modal__close" onClick={() => setUploadModal(false)}>
                <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {uploadErr && <p className="modal__error">{uploadErr}</p>}

            <form onSubmit={handleUpload} className="modal__form" noValidate>
              <div className="fld">
                <label className="fld__label" htmlFor="ul-nom">Nom du livrable *</label>
                <input
                  id="ul-nom"
                  className="fld__input"
                  value={uploadNom}
                  onChange={e => setUploadNom(e.target.value)}
                  placeholder="Ex: Rapport final v2"
                  required
                />
              </div>
              <div className="fld">
                <label className="fld__label" htmlFor="ul-file">Fichier *</label>
                <div
                  className={`file-drop${uploadFile ? ' file-drop--selected' : ''}`}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploadFile ? (
                    <span className="file-drop__name">{uploadFile.name}</span>
                  ) : (
                    <>
                      <svg viewBox="0 0 20 20" fill="currentColor" width="28" height="28" className="file-drop__icon">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <p className="file-drop__hint">Cliquez pour sélectionner un fichier</p>
                    </>
                  )}
                  <input
                    id="ul-file"
                    ref={fileRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={e => { setUploadFile(e.target.files[0] ?? null); setUploadErr(''); }}
                  />
                </div>
              </div>
              <div className="modal__ft">
                <button type="button" className="btn btn--ghost" onClick={() => setUploadModal(false)}>Annuler</button>
                <button type="submit" className="btn btn--primary" disabled={uploading}>
                  {uploading ? 'Envoi en cours…' : 'Déposer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Status modal ── */}
      {statusModal && (
        <div className="modal-overlay" onClick={() => setStatusModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__hd">
              <h2 className="modal__title">
                {statusModal.action === 'valide' ? 'Valider' : 'Rejeter'} le livrable
              </h2>
              <button className="modal__close" onClick={() => setStatusModal(null)}>
                <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="modal__sub">Livrable : <strong>{statusModal.deliverable.nom}</strong></p>

            {statusErr && <p className="modal__error">{statusErr}</p>}

            <form onSubmit={handleStatusUpdate} className="modal__form" noValidate>
              <div className="fld">
                <label className="fld__label" htmlFor="st-comment">Commentaire (optionnel)</label>
                <textarea
                  id="st-comment"
                  className="fld__input fld__textarea"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  placeholder="Ajoutez un commentaire de validation…"
                />
              </div>
              <div className="modal__ft">
                <button type="button" className="btn btn--ghost" onClick={() => setStatusModal(null)}>Annuler</button>
                <button
                  type="submit"
                  className={`btn ${statusModal.action === 'valide' ? 'btn--primary' : 'btn--danger-solid'}`}
                  disabled={statusSaving}
                >
                  {statusSaving
                    ? 'Enregistrement…'
                    : statusModal.action === 'valide' ? 'Valider' : 'Rejeter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
