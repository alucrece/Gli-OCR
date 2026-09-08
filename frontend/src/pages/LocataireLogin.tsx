import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LocataireLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/locataire/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code_acces: code })
      });
      if (!response.ok) throw new Error('Identifiants incorrects');
      const data = await response.json();
      localStorage.setItem('locataire_token', data.access_token);
      navigate('/espace-locataire');
    } catch {
      setError('Email ou code d\'accès incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--blanc-casse)'
    }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '0 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', color: 'var(--bleu-nuit)' }}>
            GLI<span style={{ color: 'var(--vert-foret)' }}>-OCR</span>
          </h1>
          <p style={{ color: 'var(--gris-ardoise)', marginTop: '0.5rem' }}>
            Espace locataire
          </p>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Connexion locataire</h2>
          <form onSubmit={handleSubmit} aria-label="Formulaire de connexion locataire">
            <div className="form-group">
              <label htmlFor="email">Adresse email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="code">Code d'accès</label>
              <input
                id="code"
                type="password"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Code fourni par votre bailleur"
                required
              />
            </div>
            {error && (
              <p className="error-message" role="alert" aria-live="polite">{error}</p>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Accéder à mon espace'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--gris-ardoise)' }}>
            Vous êtes propriétaire ?{' '}
            <a href="/login" style={{ color: 'var(--vert-foret)', fontWeight: 500 }}>
              Connexion propriétaire
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocataireLogin;