import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const registered = params.get('registered') === '1';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field) {
    return (e) => {
      setForm(f => ({ ...f, [field]: e.target.value }));
      setError('');
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.user, data.token);
      const role = data.user.role;
      if (role === 'encadrant') navigate('/encadrant/dashboard');
      else navigate('/dashboard');
    } catch {
      setError('Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">

      {/* ── Panneau latéral ── */}
      <aside className="login__panel">
        <Link to="/" className="login__logo">PFA3</Link>
        <div className="login__panel-body">
          <h2 className="login__panel-title">Bon retour parmi nous.</h2>
          <p className="login__panel-sub">
            Accédez à votre espace de gestion de projets et reprenez là où vous en étiez.
          </p>
        </div>
        <p className="login__panel-foot">
          Pas encore de compte ?{' '}
          <Link to="/register" className="login__panel-link">S'inscrire</Link>
        </p>
      </aside>

      {/* ── Formulaire ── */}
      <main className="login__form-area">
        <div className="login__form-card">
          <h1 className="login__title">Connexion</h1>
          <p className="login__subtitle">Entrez vos identifiants pour accéder à votre espace.</p>

          {registered && (
            <p className="login__success">
              Compte créé avec succès. Connectez-vous.
            </p>
          )}

          {error && <p className="login__error">{error}</p>}

          <form onSubmit={handleSubmit} noValidate className="login__form">

            <div className="lfield">
              <label className="lfield__label" htmlFor="email">Adresse e-mail</label>
              <input
                id="email"
                className="lfield__input"
                type="email"
                placeholder="marc.aurelle@junia.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                required
              />
            </div>

            <div className="lfield">
              <label className="lfield__label" htmlFor="password">Mot de passe</label>
              <input
                id="password"
                className="lfield__input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="login__submit"
              disabled={loading}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <p className="login__register-link">
            Pas encore de compte ? <Link to="/register">S'inscrire</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
