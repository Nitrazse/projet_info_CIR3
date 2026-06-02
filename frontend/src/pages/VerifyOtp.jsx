import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const OTP_TTL = 3 * 60; // secondes

export default function VerifyOtp() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const password = state?.password ?? null;

  const [digits, setDigits]       = useState(['', '', '', '']);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft]   = useState(OTP_TTL);
  const inputsRef = useRef([]);

  // Compte à rebours
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  // Gestion des 4 inputs — auto-focus sur le suivant
  function handleDigit(index, value) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError('');
    if (value && index < 3) inputsRef.current[index + 1]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  // Coller un code (ex : depuis l'email)
  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setDigits(pasted.split(''));
      inputsRef.current[3]?.focus();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 4) { setError('Entrez les 4 chiffres du code.'); return; }

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-otp', { email, code });

      // Connexion automatique si le mot de passe est disponible (passé depuis Register)
      if (password) {
        const { data: session } = await api.post('/auth/login', { email, password });
        login(session.user, session.token);
        navigate('/dashboard');
      } else {
        // Fallback si l'utilisateur a rafraîchi la page (mot de passe perdu)
        setSuccess('Compte vérifié ! Redirection vers la connexion…');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Code invalide ou expiré.');
      setDigits(['', '', '', '']);
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError('');
    try {
      await api.post('/auth/resend-otp', { email });
      setTimeLeft(OTP_TTL);
      setDigits(['', '', '', '']);
      inputsRef.current[0]?.focus();
      setSuccess('Nouveau code envoyé. Vérifiez votre boîte mail.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Impossible de renvoyer le code.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7ff' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '2.5rem 2rem', width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

        {/* Icône */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem' }}>✉️</div>
          <h1 style={{ fontSize: '1.4rem', margin: '0.5rem 0 0.25rem', color: '#1a1a2e' }}>Vérifiez votre email</h1>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
            Code envoyé à <strong>{email}</strong>
          </p>
        </div>

        {/* Messages */}
        {error && (
          <p style={{ color: '#c0392b', background: '#fdecea', padding: '0.6rem 1rem', borderRadius: 8, fontSize: '0.9rem', marginBottom: '1rem' }}>
            {error}
          </p>
        )}
        {success && (
          <p style={{ color: '#1a7f4b', background: '#d4edda', padding: '0.6rem 1rem', borderRadius: 8, fontSize: '0.9rem', marginBottom: '1rem' }}>
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {/* 4 inputs OTP */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', margin: '1.5rem 0' }} onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => (inputsRef.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                style={{
                  width: 60,
                  height: 64,
                  fontSize: '1.8rem',
                  textAlign: 'center',
                  border: `2px solid ${d ? '#2563eb' : '#ddd'}`,
                  borderRadius: 10,
                  outline: 'none',
                  color: '#1a1a2e',
                  fontWeight: 'bold',
                  transition: 'border-color 0.15s',
                }}
              />
            ))}
          </div>

          {/* Compte à rebours */}
          <p style={{ textAlign: 'center', color: timeLeft <= 30 ? '#e74c3c' : '#888', fontSize: '0.9rem', margin: '0 0 1.25rem' }}>
            {timeLeft > 0
              ? <>Code valide pendant <strong>{formatTime(timeLeft)}</strong></>
              : <span style={{ color: '#e74c3c' }}>Code expiré — renvoyez un nouveau code</span>
            }
          </p>

          <button
            type="submit"
            disabled={loading || digits.join('').length < 4}
            style={{ width: '100%', padding: '0.7rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: '1rem', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Vérification…' : 'Vérifier le code'}
          </button>
        </form>

        {/* Renvoyer */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <button
            onClick={handleResend}
            disabled={resending || timeLeft > 0}
            style={{ background: 'none', border: 'none', color: timeLeft > 0 ? '#bbb' : '#2563eb', cursor: timeLeft > 0 ? 'default' : 'pointer', fontSize: '0.9rem', textDecoration: timeLeft > 0 ? 'none' : 'underline' }}
          >
            {resending ? 'Envoi…' : 'Renvoyer un nouveau code'}
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#999' }}>
          <Link to="/login">← Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
