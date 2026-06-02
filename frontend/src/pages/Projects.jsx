import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Projects.css';

const STATUT_LABEL = { en_cours: 'En cours', termine: 'Terminé', archive: 'Archivé' };
const STATUT_OPTS  = [
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine',  label: 'Terminé' },
  { value: 'archive',  label: 'Archivé' },
];

function initForm() {
  return { nom: '', description: '', date_debut: '', date_fin: '', statut: 'en_cours' };
}

export default function Projects() {
  const { hasRole } = useAuth();
  const isEncadrant = hasRole('encadrant');
  const canEdit     = hasRole('encadrant', 'team_leader');

  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState('all');

  /* ── Modal projet ── */
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [editing, setEditing] = useState(null);
  const [form, setForm]   = useState(initForm());
  const [fErr, setFErr]   = useState('');
  const [saving, setSaving] = useState(false);

  /* ── Modal membres ── */
  const [memberModal, setMemberModal] = useState(null);
  const [memberId, setMemberId]       = useState('');
  const [memberErr, setMemberErr]     = useState('');
  const [memberSaving, setMemberSaving] = useState(false);

  const [refresh, setRefresh] = useState(0);
  function reload() { setRefresh(r => r + 1); }

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    api.get('/projects?limit=100')
      .then(({ data }) => { if (alive) setProjects(data.projects ?? []); })
      .catch(() => { if (alive) setError('Impossible de charger les projets.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [refresh]);

  function openCreate() {
    setForm(initForm());
    setFErr('');
    setEditing(null);
    setModal('create');
  }

  function openEdit(p) {
    setForm({
      nom:         p.nom,
      description: p.description ?? '',
      date_debut:  p.date_debut ? p.date_debut.substring(0, 10) : '',
      date_fin:    p.date_fin   ? p.date_fin.substring(0, 10)   : '',
      statut:      p.statut,
    });
    setFErr('');
    setEditing(p);
    setModal('edit');
  }

  function closeModal() {
    setModal(null);
    setEditing(null);
  }

  function setF(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.nom.trim()) { setFErr('Le nom est requis.'); return; }
    setSaving(true);
    setFErr('');
    try {
      if (modal === 'create') {
        await api.post('/projects', {
          nom:         form.nom.trim(),
          description: form.description.trim() || undefined,
          date_debut:  form.date_debut || undefined,
          date_fin:    form.date_fin   || undefined,
        });
      } else {
        await api.patch(`/projects/${editing.id}`, {
          nom:         form.nom.trim(),
          description: form.description.trim() || undefined,
          date_debut:  form.date_debut || undefined,
          date_fin:    form.date_fin   || undefined,
          statut:      form.statut,
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

  async function handleDelete(p) {
    if (!window.confirm(`Supprimer le projet "${p.nom}" ? Cette action est irréversible.`)) return;
    try {
      await api.delete(`/projects/${p.id}`);
      reload();
    } catch {
      alert('Impossible de supprimer ce projet.');
    }
  }

  /* ── Membres ── */
  function openMember(p) {
    setMemberModal(p);
    setMemberId('');
    setMemberErr('');
  }

  async function handleAddMember(e) {
    e.preventDefault();
    if (!memberId.trim()) { setMemberErr('L\'identifiant est requis.'); return; }
    setMemberSaving(true);
    setMemberErr('');
    try {
      await api.post(`/projects/${memberModal.id}/members`, { user_id: memberId.trim() });
      setMemberModal(null);
    } catch (err) {
      setMemberErr(err.response?.data?.error ?? 'Une erreur est survenue.');
    } finally {
      setMemberSaving(false);
    }
  }

  const displayed = filter === 'all'
    ? projects
    : projects.filter(p => p.statut === filter);

  return (
    <div className="projects-page">
      {/* Header */}
      <div className="page-hd">
        <div>
          <h1 className="page-hd__title">Projets</h1>
          <p className="page-hd__sub">{projects.length} projet{projects.length > 1 ? 's' : ''} au total</p>
        </div>
        {isEncadrant && (
          <button className="btn btn--primary" onClick={openCreate}>
            Nouveau projet
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="page-filters">
        {['all', 'en_cours', 'termine', 'archive'].map(s => (
          <button
            key={s}
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
          {isEncadrant && filter === 'all' && (
            <button className="btn btn--primary" onClick={openCreate}>
              Créer un projet
            </button>
          )}
        </div>
      ) : (
        <div className="project-grid">
          {displayed.map(p => (
            <div key={p.id} className="project-card">
              <div className="project-card__hd">
                <h2 className="project-card__name">{p.nom}</h2>
                <span className={`status-badge status-badge--${p.statut}`}>
                  {STATUT_LABEL[p.statut] ?? p.statut}
                </span>
              </div>

              {p.description && (
                <p className="project-card__desc">{p.description}</p>
              )}

              {(p.date_debut || p.date_fin) && (
                <p className="project-card__dates">
                  {p.date_debut && `Du ${new Date(p.date_debut).toLocaleDateString('fr-FR')}`}
                  {p.date_fin   && ` au ${new Date(p.date_fin).toLocaleDateString('fr-FR')}`}
                </p>
              )}

              <div className="project-card__actions">
                <Link to={`/tasks?project=${p.id}`} className="btn-sm btn-sm--ghost">
                  Voir les tâches
                </Link>
                {canEdit && (
                  <button className="btn-sm btn-sm--ghost" onClick={() => openEdit(p)}>
                    Modifier
                  </button>
                )}
                {isEncadrant && (
                  <>
                    <button className="btn-sm btn-sm--ghost" onClick={() => openMember(p)}>
                      Ajouter un membre
                    </button>
                    <button className="btn-sm btn-sm--danger" onClick={() => handleDelete(p)}>
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal projet ── */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__hd">
              <h2 className="modal__title">
                {modal === 'create' ? 'Nouveau projet' : 'Modifier le projet'}
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
                <label className="fld__label" htmlFor="p-nom">Nom du projet *</label>
                <input id="p-nom" className="fld__input" value={form.nom} onChange={setF('nom')} placeholder="Nom du projet" required />
              </div>
              <div className="fld">
                <label className="fld__label" htmlFor="p-desc">Description</label>
                <textarea id="p-desc" className="fld__input fld__textarea" value={form.description} onChange={setF('description')} placeholder="Description optionnelle" rows={3} />
              </div>
              <div className="fld-row">
                <div className="fld">
                  <label className="fld__label" htmlFor="p-start">Date de début</label>
                  <input id="p-start" className="fld__input" type="date" value={form.date_debut} onChange={setF('date_debut')} />
                </div>
                <div className="fld">
                  <label className="fld__label" htmlFor="p-end">Date de fin</label>
                  <input id="p-end" className="fld__input" type="date" value={form.date_fin} onChange={setF('date_fin')} />
                </div>
              </div>
              {modal === 'edit' && (
                <div className="fld">
                  <label className="fld__label" htmlFor="p-statut">Statut</label>
                  <select id="p-statut" className="fld__input" value={form.statut} onChange={setF('statut')}>
                    {STATUT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              )}
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

      {/* ── Modal membres ── */}
      {memberModal && (
        <div className="modal-overlay" onClick={() => setMemberModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__hd">
              <h2 className="modal__title">Ajouter un membre</h2>
              <button className="modal__close" onClick={() => setMemberModal(null)}>
                <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="modal__sub">Projet : <strong>{memberModal.nom}</strong></p>
            {memberErr && <p className="modal__error">{memberErr}</p>}
            <form onSubmit={handleAddMember} className="modal__form" noValidate>
              <div className="fld">
                <label className="fld__label" htmlFor="m-uid">Identifiant de l'utilisateur (UUID)</label>
                <input
                  id="m-uid"
                  className="fld__input"
                  value={memberId}
                  onChange={e => { setMemberId(e.target.value); setMemberErr(''); }}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  required
                />
              </div>
              <div className="modal__ft">
                <button type="button" className="btn btn--ghost" onClick={() => setMemberModal(null)}>Annuler</button>
                <button type="submit" className="btn btn--primary" disabled={memberSaving}>
                  {memberSaving ? 'Ajout…' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
