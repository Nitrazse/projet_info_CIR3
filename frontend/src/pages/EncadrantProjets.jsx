import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './EncadrantProjets.css';

const STATUT_LABEL = {
  propose: 'Proposé', valide: 'Validé', en_cours: 'En cours',
  en_retard: 'En retard', livre: 'Livré', soutenu: 'Soutenu', cloture: 'Clôturé',
};
const STATUT_COLOR = {
  propose: 'grey', valide: 'blue', en_cours: 'blue',
  en_retard: 'red', livre: 'green', soutenu: 'green', cloture: 'grey',
};

// ── Étape 1 : Infos générales ────────────────────────────────────────────────
function Step1({ form, onChange, err }) {
  return (
    <div className="ep2-step">
      <h3 className="ep2-step__title">Informations générales</h3>
      <div className="fld">
        <label className="fld__label" htmlFor="s1-nom">Nom du projet *</label>
        <input id="s1-nom" className="fld__input" value={form.nom}
          onChange={e => onChange('nom', e.target.value)} placeholder="Ex: Système de gestion PFA" />
        {err.nom && <span className="ep2-err">{err.nom}</span>}
      </div>
      <div className="fld">
        <label className="fld__label" htmlFor="s1-desc">Description</label>
        <textarea id="s1-desc" className="fld__input fld__textarea" value={form.description}
          onChange={e => onChange('description', e.target.value)}
          placeholder="Objectifs et contexte du projet…" rows={3} />
      </div>
      <div className="fld-row">
        <div className="fld">
          <label className="fld__label" htmlFor="s1-debut">Date de début</label>
          <input id="s1-debut" className="fld__input" type="date" value={form.date_debut}
            onChange={e => onChange('date_debut', e.target.value)} />
        </div>
        <div className="fld">
          <label className="fld__label" htmlFor="s1-fin">Date de fin</label>
          <input id="s1-fin" className="fld__input" type="date" value={form.date_fin}
            onChange={e => onChange('date_fin', e.target.value)} />
          {err.date_fin && <span className="ep2-err">{err.date_fin}</span>}
        </div>
      </div>
    </div>
  );
}

// ── Étape 2 : Jalons ─────────────────────────────────────────────────────────
function Step2({ jalons, onChange }) {
  function addJalon() {
    onChange([...jalons, { titre: '', date_echeance: '', description: '' }]);
  }
  function removeJalon(i) {
    onChange(jalons.filter((_, idx) => idx !== i));
  }
  function updateJalon(i, field, value) {
    const updated = jalons.map((j, idx) => idx === i ? { ...j, [field]: value } : j);
    onChange(updated);
  }

  return (
    <div className="ep2-step">
      <div className="ep2-step__hd">
        <h3 className="ep2-step__title">Jalons du projet</h3>
        <button type="button" className="ep2-add-btn" onClick={addJalon}>+ Ajouter un jalon</button>
      </div>
      {jalons.length === 0 ? (
        <div className="ep2-empty-hint">
          <p>Aucun jalon défini. Les jalons permettent de suivre les étapes clés du projet.</p>
          <button type="button" className="btn btn--ghost" onClick={addJalon}>Ajouter le premier jalon</button>
        </div>
      ) : (
        <div className="ep2-jalons">
          {jalons.map((j, i) => (
            <div key={i} className="ep2-jalon">
              <div className="ep2-jalon__num">{i + 1}</div>
              <div className="ep2-jalon__fields">
                <div className="fld-row">
                  <div className="fld">
                    <input className="fld__input" value={j.titre}
                      onChange={e => updateJalon(i, 'titre', e.target.value)}
                      placeholder="Titre du jalon *" />
                  </div>
                  <div className="fld">
                    <input className="fld__input" type="date" value={j.date_echeance}
                      onChange={e => updateJalon(i, 'date_echeance', e.target.value)} />
                  </div>
                </div>
                <input className="fld__input" value={j.description}
                  onChange={e => updateJalon(i, 'description', e.target.value)}
                  placeholder="Description (optionnelle)" />
              </div>
              <button type="button" className="ep2-jalon__remove" onClick={() => removeJalon(i)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Étape 3 : Équipe ─────────────────────────────────────────────────────────
function Step3({ membres, onChange }) {
  const [etudiants, setEtudiants] = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.get('/projects/etudiants/disponibles')
      .then(({ data }) => setEtudiants(data.etudiants ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = etudiants.filter(e =>
    !membres.find(m => m.user_id === e.id) &&
    (e.nom?.toLowerCase().includes(search.toLowerCase()) ||
     e.email?.toLowerCase().includes(search.toLowerCase()))
  );

  function add(etudiant) {
    onChange([...membres, { user_id: etudiant.id, nom: etudiant.nom, email: etudiant.email, role: 'etudiant' }]);
  }
  function remove(userId) {
    onChange(membres.filter(m => m.user_id !== userId));
  }
  function setRole(userId, role) {
    onChange(membres.map(m => m.user_id === userId ? { ...m, role } : m));
  }

  return (
    <div className="ep2-step">
      <h3 className="ep2-step__title">Équipe du projet</h3>

      {/* Membres sélectionnés */}
      {membres.length > 0 && (
        <div className="ep2-membres">
          {membres.map(m => (
            <div key={m.user_id} className="ep2-membre">
              <div className="ep2-membre__avatar">{m.nom?.[0]?.toUpperCase() ?? '?'}</div>
              <div className="ep2-membre__info">
                <span className="ep2-membre__nom">{m.nom ?? m.email}</span>
                <span className="ep2-membre__email">{m.email}</span>
              </div>
              <select
                className="ep2-membre__role"
                value={m.role}
                onChange={e => setRole(m.user_id, e.target.value)}
              >
                <option value="etudiant">Étudiant</option>
                <option value="team_leader">Chef d'équipe</option>
              </select>
              <button type="button" className="ep2-membre__remove" onClick={() => remove(m.user_id)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Recherche étudiants disponibles */}
      <div className="ep2-search">
        <input
          className="fld__input"
          placeholder="🔍 Rechercher un étudiant disponible…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="page-loading">Chargement…</div>
      ) : filtered.length === 0 ? (
        <p className="ep2-no-result">{search ? 'Aucun résultat.' : 'Aucun étudiant disponible.'}</p>
      ) : (
        <div className="ep2-etudiant-list">
          {filtered.map(e => (
            <div key={e.id} className="ep2-etudiant" onClick={() => add(e)}>
              <div className="ep2-etudiant__avatar">{e.nom?.[0]?.toUpperCase() ?? '?'}</div>
              <div className="ep2-etudiant__info">
                <span className="ep2-etudiant__nom">{e.nom}</span>
                <span className="ep2-etudiant__email">{e.email}</span>
              </div>
              <span className="ep2-etudiant__add">+ Ajouter</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Étape 4 : Grille d'évaluation ────────────────────────────────────────────
function Step4({ criteres, onChange }) {
  function addCritere() {
    onChange([...criteres, { nom: '', description: '', poids: 0 }]);
  }
  function removeCritere(i) {
    onChange(criteres.filter((_, idx) => idx !== i));
  }
  function updateCritere(i, field, value) {
    onChange(criteres.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  }

  const totalPoids = criteres.reduce((s, c) => s + (Number(c.poids) || 0), 0);
  const poidsOk    = Math.abs(totalPoids - 100) < 0.01;

  return (
    <div className="ep2-step">
      <div className="ep2-step__hd">
        <h3 className="ep2-step__title">Grille d'évaluation</h3>
        <button type="button" className="ep2-add-btn" onClick={addCritere}>+ Ajouter un critère</button>
      </div>
      <p className="ep2-step__hint">Définissez les critères et leurs pondérations (total = 100%).</p>

      {criteres.length === 0 ? (
        <div className="ep2-empty-hint">
          <p>Aucun critère défini. La grille est optionnelle.</p>
          <button type="button" className="btn btn--ghost" onClick={addCritere}>Créer une grille</button>
        </div>
      ) : (
        <>
          <div className="ep2-criteres">
            {criteres.map((c, i) => (
              <div key={i} className="ep2-critere-row">
                <div className="ep2-critere-row__fields">
                  <input className="fld__input" value={c.nom}
                    onChange={e => updateCritere(i, 'nom', e.target.value)}
                    placeholder="Nom du critère *" />
                  <input className="fld__input" value={c.description}
                    onChange={e => updateCritere(i, 'description', e.target.value)}
                    placeholder="Description" />
                  <div className="ep2-poids-row">
                    <input className="fld__input ep2-poids-input" type="number"
                      min="0" max="100" value={c.poids}
                      onChange={e => updateCritere(i, 'poids', Number(e.target.value))}
                      placeholder="%" />
                    <span className="ep2-poids-label">%</span>
                  </div>
                </div>
                <button type="button" className="ep2-jalon__remove" onClick={() => removeCritere(i)}>✕</button>
              </div>
            ))}
          </div>

          {/* Total poids */}
          <div className={`ep2-poids-total ep2-poids-total--${poidsOk ? 'ok' : totalPoids > 100 ? 'over' : 'under'}`}>
            Total : <strong>{totalPoids}%</strong>
            {poidsOk ? ' ✓' : totalPoids > 100 ? ' ⚠ Dépasse 100%' : ' ⚠ Doit atteindre 100%'}
          </div>
        </>
      )}
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
const STEPS = ['Infos générales', 'Jalons', 'Équipe', 'Grille d\'évaluation'];

export default function EncadrantProjets() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState('all');
  const [refresh, setRefresh]   = useState(0);
  function reload() { setRefresh(r => r + 1); }

  // Formulaire multi-étapes
  const [showForm, setShowForm] = useState(false);
  const [step, setStep]         = useState(0);
  const [form, setForm]         = useState({ nom: '', description: '', date_debut: '', date_fin: '' });
  const [jalons, setJalons]     = useState([]);
  const [membres, setMembres]   = useState([]);
  const [criteres, setCriteres] = useState([]);
  const [formErr, setFormErr]   = useState({});
  const [saving, setSaving]     = useState(false);
  const [globalErr, setGlobalErr] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true); setError('');
    api.get('/projects?limit=100')
      .then(({ data }) => { if (alive) setProjects(data.projects ?? []); })
      .catch(() => { if (alive) setError('Impossible de charger les projets.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [refresh]);

  function openForm() {
    setForm({ nom: '', description: '', date_debut: '', date_fin: '' });
    setJalons([]); setMembres([]); setCriteres([]);
    setStep(0); setFormErr({}); setGlobalErr('');
    setShowForm(true);
  }

  function validateStep() {
    const errs = {};
    if (step === 0) {
      if (!form.nom.trim()) errs.nom = 'Le nom est requis.';
      if (form.date_debut && form.date_fin && form.date_fin < form.date_debut)
        errs.date_fin = 'La date de fin doit être après la date de début.';
    }
    if (step === 1) {
      jalons.forEach((j, i) => {
        if (!j.titre.trim()) errs[`jalon_${i}`] = 'Titre requis';
        if (!j.date_echeance) errs[`jalond_${i}`] = 'Date requise';
      });
    }
    if (step === 3 && criteres.length > 0) {
      const total = criteres.reduce((s, c) => s + (Number(c.poids) || 0), 0);
      if (Math.abs(total - 100) > 0.01) errs.poids = `Total des poids = ${total}%, doit être 100%.`;
      criteres.forEach((c, i) => { if (!c.nom.trim()) errs[`critere_${i}`] = 'Nom requis'; });
    }
    setFormErr(errs);
    return Object.keys(errs).length === 0;
  }

  function nextStep() {
    if (!validateStep()) return;
    setStep(s => Math.min(STEPS.length - 1, s + 1));
  }
  function prevStep() { setStep(s => Math.max(0, s - 1)); }

  async function handleSubmit() {
    if (!validateStep()) return;
    setSaving(true); setGlobalErr('');
    try {
      const jalonsFiltres = jalons.filter(j => j.titre.trim() && j.date_echeance);
      const { data: pData } = await api.post('/projects', {
        nom: form.nom.trim(),
        description: form.description.trim() || undefined,
        date_debut: form.date_debut || undefined,
        date_fin: form.date_fin || undefined,
        jalons: jalonsFiltres.length > 0 ? jalonsFiltres : undefined,
      });

      const projectId = pData.project.id;

      // Ajouter membres
      for (const m of membres) {
        await api.post(`/projects/${projectId}/members`, { user_id: m.user_id, role: m.role });
      }

      // Créer grille si critères définis
      if (criteres.length > 0) {
        await api.post('/evaluations/grilles', {
          nom: `Grille — ${form.nom.trim()}`,
          criteres: criteres.map(c => ({ nom: c.nom, description: c.description, poids: Number(c.poids) })),
        });
      }

      setShowForm(false);
      reload();
    } catch (err) {
      setGlobalErr(err.response?.data?.error ?? 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  }

  const displayed = filter === 'all' ? projects : projects.filter(p => p.statut === filter);

  return (
    <div className="ep2-page">
      <div className="page-hd">
        <div>
          <h1 className="page-hd__title">Mes projets</h1>
          <p className="page-hd__sub">{projects.length} projet{projects.length !== 1 ? 's' : ''} supervisé{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn--primary" onClick={openForm}>+ Nouveau projet</button>
      </div>

      {/* Filtres */}
      <div className="page-filters">
        {['all', 'propose', 'en_cours', 'en_retard', 'livre', 'cloture'].map(s => (
          <button key={s}
            className={`filter-btn${filter === s ? ' filter-btn--active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'Tous' : STATUT_LABEL[s]}
          </button>
        ))}
      </div>

      {error && <p className="page-error">{error}</p>}

      {loading ? (
        <div className="page-loading">Chargement…</div>
      ) : displayed.length === 0 ? (
        <div className="page-empty">
          <p>Aucun projet{filter !== 'all' ? ' pour ce filtre' : ''}.</p>
          {filter === 'all' && (
            <button className="btn btn--primary" onClick={openForm}>Créer le premier projet</button>
          )}
        </div>
      ) : (
        <div className="project-grid">
          {displayed.map(p => (
            <div key={p.id} className="project-card">
              <div className="project-card__hd">
                <h2 className="project-card__name">{p.nom}</h2>
                <span className={`status-badge status-badge--${STATUT_COLOR[p.statut] ?? 'grey'}`}>
                  {STATUT_LABEL[p.statut] ?? p.statut}
                </span>
              </div>
              {p.description && <p className="project-card__desc">{p.description}</p>}
              {(p.date_debut || p.date_fin) && (
                <p className="project-card__dates">
                  {p.date_debut && `Du ${new Date(p.date_debut).toLocaleDateString('fr-FR')}`}
                  {p.date_fin   && ` au ${new Date(p.date_fin).toLocaleDateString('fr-FR')}`}
                </p>
              )}
              <div className="project-card__actions">
                <Link to={`/encadrant/projets/${p.id}`} className="btn-sm btn-sm--ghost">
                  Voir le détail
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Formulaire multi-étapes ── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="ep2-wizard" onClick={e => e.stopPropagation()}>

            {/* En-tête wizard */}
            <div className="ep2-wizard__hd">
              <h2 className="ep2-wizard__title">Nouveau projet</h2>
              <button className="modal__close" onClick={() => setShowForm(false)}>
                <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Stepper */}
            <div className="ep2-stepper">
              {STEPS.map((s, i) => (
                <div key={s} className={`ep2-stepper__step${i === step ? ' ep2-stepper__step--active' : i < step ? ' ep2-stepper__step--done' : ''}`}>
                  <div className="ep2-stepper__dot">{i < step ? '✓' : i + 1}</div>
                  <span className="ep2-stepper__label">{s}</span>
                </div>
              ))}
            </div>

            {/* Contenu étape */}
            <div className="ep2-wizard__body">
              {globalErr && <p className="modal__error">{globalErr}</p>}
              {step === 0 && <Step1 form={form} onChange={(f, v) => setForm(p => ({ ...p, [f]: v }))} err={formErr} />}
              {step === 1 && <Step2 jalons={jalons} onChange={setJalons} />}
              {step === 2 && <Step3 membres={membres} onChange={setMembres} />}
              {step === 3 && <Step4 criteres={criteres} onChange={setCriteres} />}
            </div>

            {/* Navigation */}
            <div className="ep2-wizard__ft">
              <button className="btn btn--ghost" onClick={step === 0 ? () => setShowForm(false) : prevStep}>
                {step === 0 ? 'Annuler' : '← Précédent'}
              </button>
              {step < STEPS.length - 1 ? (
                <button className="btn btn--primary" onClick={nextStep}>Suivant →</button>
              ) : (
                <button className="btn btn--primary" onClick={handleSubmit} disabled={saving}>
                  {saving ? 'Création…' : '✓ Créer le projet'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
