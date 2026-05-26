import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const registered = params.get('registered') === '1';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.user, data.token);
      navigate('/dashboard');
    } catch {
      setError('Identifiants incorrects.');
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '6rem auto', padding: '0 1rem' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Connexion</h1>
      {registered && (
        <p style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#16a34a', fontSize: '0.875rem' }}>
          Compte créé avec succès. Connectez-vous.
        </p>
      )}
      {error && (
        <p style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: '0.875rem' }}>
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.82rem', fontWeight: 600 }}>
          Adresse e-mail
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            style={{ padding: '0.65rem 0.9rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.82rem', fontWeight: 600 }}>
          Mot de passe
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            style={{ padding: '0.65rem 0.9rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none' }}
          />
        </label>
        <button
          type="submit"
          style={{ marginTop: '0.5rem', padding: '0.8rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Se connecter
        </button>
      </form>
      <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text)' }}>
        Pas encore de compte ? <Link to="/register" style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>S'inscrire</Link>
      </p>
    </div>
  );
}
