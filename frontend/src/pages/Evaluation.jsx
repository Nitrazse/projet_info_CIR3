import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Evaluation.css';

function initEval() {
  return { note: '', criteres: '', commentaire: '' };
}

export default function Evaluation() {
  const { hasRole } = useAuth();
  const canCreate = hasRole('encadrant', 'jury');

  const [projects, setProjects]       = useState([]);
  const [projectId, setProjectId]     = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  /* ── Modal ── */
  const [modal, setModal]     = useState(null); // null | 'create' | 'edit'
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(initEval());
  const [fErr, setFErr]       = useState('');
  const [saving, setSaving]   = useState(false);

  const [exporting, setExporting] = useState(false);

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
    api.get(`/evaluations?project_id=${projectId}&limit=100`)
      .then(({ data }) => { if (alive) setEvaluations(data.evaluations ?? []); })
      .catch(() => { if (alive) setError('Impossible de charger les évaluations.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [projectId, refresh]);

  function openCreate() {
    setForm(initEval());
    setFErr('');
    setEditing(null);
    setModal('create');
  }

  function openEdit(ev) {
    setForm({
      note:        String(ev.note),
      criteres:    ev.criteres ?? '',
      commentaire: ev.commentaire ?? '',
    });
    setFErr('');
    setEditing(ev);
    setModal('edit');
  }

  function closeModal() { setModal(null); setEditing(null); }
  function setF(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })); }

  async function handleSave(e) {
    e.preventDefault();
    const noteNum = parseFloat(form.note);
    if (isNaN(noteNum) || noteNum < 0 || noteNum > 20) {
      setFErr('La note doit être un nombre entre 0 et 20.');
      return;
    }
    setSaving(true);
    setFErr('');
    try {
      if (modal === 'create') {
        await api.post('/evaluations', {
          project_id:  projectId,
          note:        noteNum,
          criteres:    form.criteres.trim() || undefined,
          commentaire: form.commentaire.trim() || undefined,
        });
      } else {
        await api.patch(`/evaluations/${editing.id}`, {
          note:        noteNum,
          criteres:    form.criteres.trim() || undefined,
          commentaire: form.commentaire.trim() || undefined,
        });
      }
      closeModal();
      reload();
    } catch (err) {
      setFErr(err.response?.data?.error ?? 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    if (!projectId) return;
    setExporting(true);
    try {
      const response = await api.get(`/evaluations/${projectId}/export`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `evaluations_projet_${projectId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Aucune évaluation à exporter pour ce projet.');
    } finally {
      setExporting(false);
    }
  }

  function noteColor(note) {
    if (note >= 14) return 'green';
    if (note >= 10) return 'blue';
    if (note >= 6)  return 'amber';
    return 'red';
  }

  const avg = evaluations.length
    ? (evaluations.reduce((s, e) => s + Number(e.note), 0) / evaluations.length).toFixed(2)
    : null;

  return (
    <div className="eval-page">
      <div className="page-hd">
        <div>
          <h1 className="page-hd__title">Évaluation</h1>
          <p className="page-hd__sub">Notation des projets sur 20</p>
        </div>
        <div className="eval-page__actions">
          {canCreate && projectId && (
            <button className="btn btn--primary" onClick={openCreate}>
              Nouvelle évaluation
            </button>
          )}
          {canCreate && evaluations.length > 0 && (
            <button className="btn btn--ghost" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Export…' : 'Exporter CSV'}
            </button>
          )}
        </div>
      </div>

      <div className="tasks-selector">
        <label className="fld__label" htmlFor="ev-project">Projet</label>
        <select
          id="ev-project"
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
        <div className="page-empty"><p>Sélectionnez un projet pour voir ses évaluations.</p></div>
      ) : loading ? (
        <div className="page-loading">Chargement…</div>
      ) : (
        <>
          {/* Summary */}
          {evaluations.length > 0 && (
            <div className="eval-summary">
              <div className="eval-summary__item">
                <span className="eval-summary__val">{evaluations.length}</span>
                <span className="eval-summary__label">Évaluation{evaluations.length > 1 ? 's' : ''}</span>
              </div>
              <div className="eval-summary__item">
                <span className={`eval-summary__val eval-summary__val--${noteColor(avg)}`}>{avg}/20</span>
                <span className="eval-summary__label">Moyenne</span>
              </div>
            </div>
          )}

          {evaluations.length === 0 ? (
            <div className="page-empty">
              <p>Aucune évaluation pour ce projet.</p>
              {canCreate && (
                <button className="btn btn--primary" onClick={openCreate}>
                  Créer la première évaluation
                </button>
              )}
            </div>
          ) : (
            <div className="eval-list">
              {evaluations.map(ev => (
                <div key={ev.id} className="eval-card">
                  <div className="eval-card__hd">
                    <div className={`eval-note eval-note--${noteColor(ev.note)}`}>
                      <span className="eval-note__val">{ev.note}</span>
                      <span className="eval-note__max">/20</span>
                    </div>
                    <div className="eval-card__body">
                      {ev.criteres && (
                        <p className="eval-card__criteres">{ev.criteres}</p>
                      )}
                      {ev.commentaire && (
                        <p className="eval-card__comment">{ev.commentaire}</p>
                      )}
                      <p className="eval-card__date">
                        {new Date(ev.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </p>
                    </div>
                    {canCreate && (
                      <button className="btn-sm btn-sm--ghost" onClick={() => openEdit(ev)}>
                        Modifier
                      </button>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="eval-bar">
                    <div
                      className={`eval-bar__fill eval-bar__fill--${noteColor(ev.note)}`}
                      style={{ width: `${(ev.note / 20) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Modal évaluation ── */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__hd">
              <h2 className="modal__title">
                {modal === 'create' ? 'Nouvelle évaluation' : 'Modifier l\'évaluation'}
              </h2>
              <button className="modal__close" onClick={closeModal}>
                <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {fErr && <p className="modal__error">{fErr}</p>}

            <form onSubmit={handleSave} className="modal__form" noValidate>
              <div className="fld">
                <label className="fld__label" htmlFor="ev-note">Note (0–20) *</label>
                <input
                  id="ev-note"
                  className="fld__input"
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={form.note}
                  onChange={setF('note')}
                  placeholder="Ex: 15"
                  required
                />
              </div>
              <div className="fld">
                <label className="fld__label" htmlFor="ev-criteres">Critères évalués</label>
                <input
                  id="ev-criteres"
                  className="fld__input"
                  value={form.criteres}
                  onChange={setF('criteres')}
                  placeholder="Ex: Architecture, présentation, code…"
                />
              </div>
              <div className="fld">
                <label className="fld__label" htmlFor="ev-comment">Commentaire</label>
                <textarea
                  id="ev-comment"
                  className="fld__input fld__textarea"
                  value={form.commentaire}
                  onChange={setF('commentaire')}
                  rows={4}
                  placeholder="Observations, points forts, axes d'amélioration…"
                />
              </div>
              <div className="modal__ft">
                <button type="button" className="btn btn--ghost" onClick={closeModal}>Annuler</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Enregistrement…' : modal === 'create' ? 'Créer' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
