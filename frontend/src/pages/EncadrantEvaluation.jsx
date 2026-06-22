import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import './EncadrantEvaluation.css';

// ── Utilitaires ──────────────────────────────────────────────────────────────
function noteColor(note) {
  if (note >= 14) return 'green';
  if (note >= 10) return 'blue';
  if (note >= 6)  return 'amber';
  return 'red';
}

// Rendu markdown léger : **gras**, *italique*, - listes
function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/^- (.+)$/gm,     '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n/g, '<br/>');
}

// ── Composant slider critère ─────────────────────────────────────────────────
function CritereSlider({ critere, value, onChange }) {
  return (
    <div className="ee-critere">
      <div className="ee-critere__hd">
        <div>
          <span className="ee-critere__nom">{critere.nom}</span>
          {critere.description && (
            <span className="ee-critere__desc">{critere.description}</span>
          )}
        </div>
        <div className="ee-critere__right">
          <span className="ee-critere__poids">{critere.poids}%</span>
          <div className="ee-critere__note-box">
            <input
              type="number"
              className="ee-critere__input"
              min="0" max="20" step="0.5"
              value={value}
              onChange={e => onChange(Math.min(20, Math.max(0, parseFloat(e.target.value) || 0)))}
            />
            <span className="ee-critere__input-max">/20</span>
          </div>
        </div>
      </div>
      <div className="ee-critere__slider-row">
        <input
          type="range"
          className="ee-critere__slider"
          min="0" max="20" step="0.5"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ '--pct': `${(value / 20) * 100}%` }}
        />
        <span className="ee-critere__contrib">
          contribution : <strong>{((value * critere.poids) / 100).toFixed(2)}</strong> pts
        </span>
      </div>
    </div>
  );
}

// ── Modale confirmation soumission ───────────────────────────────────────────
function ConfirmModal({ note, onConfirm, onCancel, saving }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
        <div className="modal__hd">
          <h2 className="modal__title">Soumettre l'évaluation ?</h2>
        </div>
        <div className="ee-confirm-body">
          <div className={`ee-confirm-note ee-confirm-note--${noteColor(note)}`}>
            {note}/20
          </div>
          <p className="ee-confirm-text">
            Une fois soumise, l'évaluation sera <strong>définitivement verrouillée</strong> et ne pourra plus être modifiée. L'équipe sera notifiée.
          </p>
        </div>
        <div className="modal__ft">
          <button className="btn btn--ghost" onClick={onCancel}>Annuler</button>
          <button className="btn btn--primary" onClick={onConfirm} disabled={saving}>
            {saving ? 'Soumission…' : 'Confirmer et soumettre'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function EncadrantEvaluation() {
  const [projects, setProjects]     = useState([]);
  const [grilles, setGrilles]       = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [projectId, setProjectId]   = useState('');
  const [groupes, setGroupes]       = useState([]);
  const [groupeId, setGroupeId]     = useState('');
  const [grilleId, setGrilleId]     = useState('');
  const [grille, setGrille]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [refresh, setRefresh]       = useState(0);

  // Formulaire notes par critère
  const [notesCriteres, setNotesCriteres] = useState({});
  const [commentaire, setCommentaire]     = useState('');
  const [mdPreview, setMdPreview]         = useState(false);

  // États de sauvegarde
  const [evalId, setEvalId]         = useState(null); // ID brouillon en cours
  const [saving, setSaving]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saveMsg, setSaveMsg]       = useState('');
  const [fErr, setFErr]             = useState('');

  const [exporting, setExporting]   = useState(false);

  // Charger projets et grilles
  useEffect(() => {
    Promise.all([
      api.get('/projects?limit=100'),
      api.get('/evaluations/grilles'),
    ]).then(([pRes, gRes]) => {
      const ps = pRes.data.projects ?? [];
      setProjects(ps);
      setGrilles(gRes.data.grilles ?? []);
      if (ps.length > 0) setProjectId(String(ps[0].id));
    }).catch(() => {});
  }, []);

  // Charger les groupes quand le projet change
  useEffect(() => {
    if (!projectId) { setGroupes([]); setGroupeId(''); return; }
    api.get(`/projects/${projectId}/groupes`)
      .then(({ data }) => {
        const gs = data.groupes ?? [];
        setGroupes(gs);
        setGroupeId(gs.length > 0 ? gs[0].id : '');
      })
      .catch(() => {});
  }, [projectId]);

  // Charger évaluations du projet
  useEffect(() => {
    if (!projectId) return;
    let alive = true;
    setLoading(true); setError('');
    api.get(`/evaluations?project_id=${projectId}&limit=100`)
      .then(({ data }) => { if (alive) setEvaluations(data.evaluations ?? []); })
      .catch(() => { if (alive) setError('Impossible de charger les évaluations.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [projectId, refresh]);

  // Charger détail grille sélectionnée
  useEffect(() => {
    if (!grilleId) { setGrille(null); setNotesCriteres({}); return; }
    api.get(`/evaluations/grilles/${grilleId}`)
      .then(({ data }) => {
        setGrille(data.grille);
        // Initialiser notes à 10 par défaut
        const init = {};
        data.grille.criteres.forEach(c => { init[c.nom] = 10; });
        setNotesCriteres(init);
        setEvalId(null);
        setSaveMsg('');
        setCommentaire('');
      })
      .catch(() => {});
  }, [grilleId]);

  function reload() { setRefresh(r => r + 1); }

  // Calcul note pondérée en temps réel
  const notePonderee = useMemo(() => {
    if (!grille) return 0;
    let total = 0;
    for (const c of grille.criteres) {
      total += ((notesCriteres[c.nom] ?? 0) * c.poids) / 100;
    }
    return Math.round(total * 100) / 100;
  }, [grille, notesCriteres]);

  function setNote(nom, val) {
    setNotesCriteres(prev => ({ ...prev, [nom]: val }));
    setSaveMsg('');
  }

  // Sauvegarde brouillon
  async function handleSaveDraft() {
    if (!projectId || !grilleId || !groupeId) return;
    setSaving(true); setFErr(''); setSaveMsg('');
    try {
      if (evalId) {
        await api.patch(`/evaluations/${evalId}`, { notes_criteres: notesCriteres, commentaire });
      } else {
        const { data } = await api.post('/evaluations', {
          project_id: projectId,
          groupe_id: groupeId,
          grille_id: grilleId,
          notes_criteres: notesCriteres,
          commentaire,
        });
        setEvalId(data.evaluation.id);
      }
      setSaveMsg('✓ Brouillon sauvegardé');
      reload();
    } catch (err) {
      setFErr(err.response?.data?.error ?? 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  // Soumission définitive
  async function handleSubmit() {
    setSubmitting(true); setFErr('');
    try {
      let id = evalId;
      if (!id) {
        const { data } = await api.post('/evaluations', {
          project_id: projectId,
          groupe_id: groupeId,
          grille_id: grilleId,
          notes_criteres: notesCriteres,
          commentaire,
        });
        id = data.evaluation.id;
      } else {
        await api.patch(`/evaluations/${id}`, { notes_criteres: notesCriteres, commentaire });
      }
      await api.post(`/evaluations/${id}/soumettre`);
      setShowConfirm(false);
      setGrilleId('');
      setGrille(null);
      setEvalId(null);
      setNotesCriteres({});
      setCommentaire('');
      setSaveMsg('');
      reload();
    } catch (err) {
      setFErr(err.response?.data?.error ?? 'Erreur lors de la soumission.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExport() {
    if (!projectId) return;
    setExporting(true);
    try {
      const response = await api.get(`/evaluations/${projectId}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url; a.download = `evaluations_${projectId}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Aucune évaluation à exporter.'); }
    finally { setExporting(false); }
  }

  const avg = evaluations.length
    ? (evaluations.reduce((s, e) => s + Number(e.note), 0) / evaluations.length).toFixed(2)
    : null;

  return (
    <div className="ee-page">
      <div className="page-hd">
        <div>
          <h1 className="page-hd__title">Évaluations</h1>
          <p className="page-hd__sub">Notation par grille de critères pondérés</p>
        </div>
        {evaluations.length > 0 && (
          <button className="btn btn--ghost" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Export…' : 'Exporter CSV'}
          </button>
        )}
      </div>

      {/* Sélecteur projet */}
      <div className="ee-selectors">
        <div className="fld">
          <label className="fld__label" htmlFor="ee-project">Projet</label>
          <select
            id="ee-project"
            className="fld__input tasks-select"
            value={projectId}
            onChange={e => { setProjectId(e.target.value); setGrilleId(''); setGrille(null); setEvalId(null); }}
          >
            <option value="">-- Sélectionner un projet --</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </div>

        {projectId && groupes.length > 0 && (
          <div className="fld">
            <label className="fld__label" htmlFor="ee-groupe">Groupe à évaluer</label>
            <select
              id="ee-groupe"
              className="fld__input tasks-select"
              value={groupeId}
              onChange={e => { setGroupeId(e.target.value); setEvalId(null); setSaveMsg(''); }}
            >
              <option value="">-- Sélectionner un groupe --</option>
              {groupes.map(g => (
                <option key={g.id} value={g.id}>
                  {g.nom} ({g.membres?.length ?? 0} étudiant{(g.membres?.length ?? 0) > 1 ? 's' : ''})
                </option>
              ))}
            </select>
          </div>
        )}

        {projectId && (
          <div className="fld">
            <label className="fld__label" htmlFor="ee-grille">Grille d'évaluation</label>
            <select
              id="ee-grille"
              className="fld__input tasks-select"
              value={grilleId}
              onChange={e => setGrilleId(e.target.value)}
            >
              <option value="">-- Sélectionner une grille --</option>
              {grilles.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
            </select>
          </div>
        )}
      </div>

      {error && <p className="page-error">{error}</p>}

      <div className="ee-layout">
        {/* ── Formulaire grille ── */}
        {grille && (
          <div className="ee-form-col">
            <div className="ee-form-card">
              <div className="ee-form-card__hd">
                <h2 className="ee-form-card__title">{grille.nom}</h2>
                {grille.description && <p className="ee-form-card__desc">{grille.description}</p>}
              </div>

              {fErr && <p className="modal__error">{fErr}</p>}

              {/* Critères */}
              <div className="ee-criteres">
                {grille.criteres.map(c => (
                  <CritereSlider
                    key={c.nom}
                    critere={c}
                    value={notesCriteres[c.nom] ?? 10}
                    onChange={val => setNote(c.nom, val)}
                  />
                ))}
              </div>

              {/* Note finale temps réel */}
              <div className={`ee-note-finale ee-note-finale--${noteColor(notePonderee)}`}>
                <span className="ee-note-finale__label">Note finale pondérée</span>
                <span className="ee-note-finale__val">{notePonderee}</span>
                <span className="ee-note-finale__max">/20</span>
                <div className="ee-note-finale__bar">
                  <div
                    className={`ee-note-finale__fill ee-note-finale__fill--${noteColor(notePonderee)}`}
                    style={{ width: `${(notePonderee / 20) * 100}%` }}
                  />
                </div>
              </div>

              {/* Commentaire markdown */}
              <div className="fld">
                <div className="ee-md-hd">
                  <label className="fld__label">Commentaire</label>
                  <div className="ee-md-tabs">
                    <button
                      type="button"
                      className={`ee-md-tab${!mdPreview ? ' ee-md-tab--active' : ''}`}
                      onClick={() => setMdPreview(false)}
                    >Éditer</button>
                    <button
                      type="button"
                      className={`ee-md-tab${mdPreview ? ' ee-md-tab--active' : ''}`}
                      onClick={() => setMdPreview(true)}
                    >Aperçu</button>
                  </div>
                </div>
                {!mdPreview ? (
                  <textarea
                    className="fld__input fld__textarea"
                    value={commentaire}
                    onChange={e => setCommentaire(e.target.value)}
                    rows={4}
                    placeholder="**Points forts**, *axes d'amélioration*...&#10;- Critère 1&#10;- Critère 2"
                  />
                ) : (
                  <div
                    className="ee-md-preview"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(commentaire) || '<em style="color:#94a3b8">Aucun commentaire</em>' }}
                  />
                )}
                <p className="ee-md-hint">Supporte **gras**, *italique*, - listes</p>
              </div>

              {/* Actions */}
              <div className="ee-form-actions">
                {saveMsg && <span className="ee-save-msg">{saveMsg}</span>}
                <button
                  className="btn btn--ghost"
                  onClick={handleSaveDraft}
                  disabled={saving}
                >
                  {saving ? 'Sauvegarde…' : evalId ? '💾 Mettre à jour le brouillon' : '💾 Sauvegarder brouillon'}
                </button>
                <button
                  className="btn btn--primary"
                  onClick={() => setShowConfirm(true)}
                  disabled={saving}
                >
                  Soumettre l'évaluation →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Historique évaluations ── */}
        {projectId && (
          <div className="ee-history-col">
            <h2 className="ee-history-title">
              Évaluations soumises
              {avg && <span className="ee-avg">Moyenne : <strong>{avg}/20</strong></span>}
            </h2>

            {loading ? (
              <div className="page-loading">Chargement…</div>
            ) : evaluations.length === 0 ? (
              <div className="page-empty"><p>Aucune évaluation soumise.</p></div>
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
                        <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginBottom:'0.25rem'}}>
                          <span className={`dash-badge dash-badge--${ev.statut === 'soumise' ? 'green' : 'grey'}`}>
                            {ev.statut === 'soumise' ? 'Soumise' : 'Brouillon'}
                          </span>
                          {ev.groupe_nom && (
                            <span className="dash-badge dash-badge--blue">👥 {ev.groupe_nom}</span>
                          )}
                        </div>
                        {ev.commentaire && (
                          <p className="eval-card__comment"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(ev.commentaire) }}
                          />
                        )}
                        <p className="eval-card__date">
                          {new Date(ev.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
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
          </div>
        )}
      </div>

      {/* Modale confirmation */}
      {showConfirm && (
        <ConfirmModal
          note={notePonderee}
          onConfirm={handleSubmit}
          onCancel={() => setShowConfirm(false)}
          saving={submitting}
        />
      )}
    </div>
  );
}
