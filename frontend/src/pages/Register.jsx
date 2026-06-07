import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Register.css';

const IS_DEV = import.meta.env.DEV;

const PANEL = {
  etudiant:  { theme: 'blue',  title: 'Bienvenue sur PFA3',     sub: 'Gère tes projets, collabore avec ton équipe et rends tes livrables sereinement.' },
  encadrant: { theme: 'amber', title: 'Votre espace enseignant', sub: 'Supervisez vos groupes, évaluez les livrables et identifiez les retards en un coup d\'œil.' },
};

const ROLE_LABELS = {
  etudiant:  'Étudiant',
  encadrant: 'Encadrant',
};

function getRoleFromEmail(email) {
  if (email.endsWith('@student.junia.com')) return 'etudiant';
  if (
    (email.endsWith('@junia.com') && !email.endsWith('@student.junia.com')) ||
    email.endsWith('@ext.junia.com')
  ) return 'encadrant';
  if (IS_DEV && email.endsWith('@gmail.com')) return 'encadrant';
  return null;
}

const EMAIL_HINT = IS_DEV
  ? 'Adresse requise : @student.junia.com, @junia.com, @ext.junia.com ou @gmail.com (dev)'
  : 'Adresse requise : @student.junia.com, @junia.com ou @ext.junia.com';

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm]         = useState({ nom: '', email: '', password: '', confirm: '' });
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);

  const detectedRole = getRoleFromEmail(form.email.trim());
  const panel = PANEL[detectedRole] ?? PANEL.etudiant;

  function set(field) {
    return (e) => {
      setForm(f => ({ ...f, [field]: e.target.value }));
      setErrors(err => ({ ...err, [field]: '' }));
    };
  }

  function validate() {
    const e = {};
    if (!form.nom.trim()) e.nom = 'Le nom est requis.';
    if (!form.email.trim()) {
      e.email = 'L\'email est requis.';
    } else if (!getRoleFromEmail(form.email.trim())) {
      e.email = 'Domaine non reconnu. Utilisez @student.junia.com, @junia.com ou @ext.junia.com';
    }
    if (form.password.length < 8)         e.password = 'Minimum 8 caractères.';
    if (form.password !== form.confirm)   e.confirm  = 'Les mots de passe ne correspondent pas.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        nom:      form.nom.trim(),
        email:    form.email.trim(),
        password: form.password,
      });
      navigate(
        `/verify-otp?email=${encodeURIComponent(form.email.trim())}`,
        { state: { password: form.password } }
      );
    } catch (err) {
      setApiError(err.response?.data?.error ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`register register--${panel.theme}`}>

      {/* ── Panneau latéral ── */}
      <aside className="register__panel">
        <Link to="/" className="register__logo">PFA3</Link>
        <div className="register__panel-body">
          <h2 className="register__panel-title">{panel.title}</h2>
          <p className="register__panel-sub">{panel.sub}</p>
        </div>
        <p className="register__panel-foot">
          Déjà un compte ?{' '}
          <Link to="/login" className="register__panel-link">Se connecter</Link>
        </p>
      </aside>

      {/* ── Formulaire ── */}
      <main className="register__form-area">
        <div className="register__form-card">
          <h1 className="register__title">Créer un compte</h1>
          <p className="register__subtitle">Remplissez les informations ci-dessous.</p>

          {apiError && <p className="register__api-error">{apiError}</p>}

          <form onSubmit={handleSubmit} noValidate className="register__form">

            {/* Nom */}
            <div className={`rfield${errors.nom ? ' rfield--error' : ''}`}>
              <label className="rfield__label" htmlFor="nom">Nom complet</label>
              <input
                id="nom"
                className="rfield__input"
                type="text"
                placeholder="Jean Dupont"
                value={form.nom}
                onChange={set('nom')}
                autoComplete="name"
              />
              {errors.nom && <span className="rfield__msg">{errors.nom}</span>}
            </div>

            {/* Email — le rôle est déduit du domaine */}
            <div className={`rfield${errors.email ? ' rfield--error' : ''}`}>
              <label className="rfield__label" htmlFor="email">Adresse e-mail</label>
              <input
                id="email"
                className="rfield__input"
                type="email"
                placeholder="prenom.nom@student.junia.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
              />
              {!errors.email && detectedRole && (
                <span className="rfield__role-badge">
                  Rôle détecté : <strong>{ROLE_LABELS[detectedRole]}</strong>
                </span>
              )}
              {!errors.email && !detectedRole && (
                <span className="rfield__hint">{EMAIL_HINT}</span>
              )}
              {errors.email && <span className="rfield__msg">{errors.email}</span>}
            </div>

            {/* Mot de passe */}
            <div className={`rfield${errors.password ? ' rfield--error' : ''}`}>
              <label className="rfield__label" htmlFor="password">Mot de passe</label>
              <input
                id="password"
                className="rfield__input"
                type="password"
                placeholder="8 caractères minimum"
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
              />
              {errors.password && <span className="rfield__msg">{errors.password}</span>}
            </div>

            {/* Confirmation */}
            <div className={`rfield${errors.confirm ? ' rfield--error' : ''}`}>
              <label className="rfield__label" htmlFor="confirm">Confirmer le mot de passe</label>
              <input
                id="confirm"
                className="rfield__input"
                type="password"
                placeholder="Répétez le mot de passe"
                value={form.confirm}
                onChange={set('confirm')}
                autoComplete="new-password"
              />
              {errors.confirm && <span className="rfield__msg">{errors.confirm}</span>}
            </div>

            <button
              type="submit"
              className="register__submit"
              disabled={loading}
            >
              {loading ? 'Création en cours…' : 'Créer mon compte'}
            </button>

          </form>

          <p className="register__login-link">
            Déjà un compte ? <Link to="/login">Se connecter</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
