import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Profil: React.FC = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    ancien_password: '',
    nouveau_password: '',
    confirm_password: ''
  });
  const [successInfos, setSuccessInfos] = useState(false);
  const [successPassword, setSuccessPassword] = useState(false);
  const [errorInfos, setErrorInfos] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [loadingInfos, setLoadingInfos] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleUpdateInfos = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInfos('');
    setSuccessInfos(false);
    setLoadingInfos(true);
    try {
      await api.put('/auth/me', {
        nom: form.nom,
        prenom: form.prenom
      });
      setSuccessInfos(true);
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      setErrorInfos('Erreur lors de la mise à jour.');
    } finally {
      setLoadingInfos(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPassword('');
    setSuccessPassword(false);
    if (form.nouveau_password !== form.confirm_password) {
      setErrorPassword('Les mots de passe ne correspondent pas.');
      return;
    }
    if (form.nouveau_password.length < 6) {
      setErrorPassword('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setLoadingPassword(true);
    try {
      await api.put('/auth/password', {
        ancien_password: form.ancien_password,
        nouveau_password: form.nouveau_password
      });
      setSuccessPassword(true);
      setForm({ ...form, ancien_password: '', nouveau_password: '', confirm_password: '' });
    } catch {
      setErrorPassword('Ancien mot de passe incorrect.');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Mon profil</h2>
        <p>Gérez vos informations personnelles</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Infos personnelles */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Informations personnelles</h3>

          <div style={{
            width: '64px', height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--bleu-nuit)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 600, color: 'white',
            marginBottom: '1.5rem'
          }}>
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>

          <form onSubmit={handleUpdateInfos}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  value={form.prenom}
                  onChange={e => setForm({ ...form, prenom: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Adresse email</label>
              <input
                type="email"
                value={form.email}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--gris-ardoise)', marginTop: '0.25rem' }}>
                L'email ne peut pas être modifié
              </p>
            </div>

            {successInfos && (
              <div style={{ padding: '0.75rem', backgroundColor: '#D1FAE5', borderRadius: '8px', marginBottom: '1rem' }}>
                <p style={{ color: 'var(--vert-foret)', fontSize: '0.85rem' }}>✅ Informations mises à jour avec succès</p>
              </div>
            )}
            {errorInfos && <p className="error-message">{errorInfos}</p>}

            <button type="submit" className="btn btn-primary" disabled={loadingInfos}>
              {loadingInfos ? 'Enregistrement...' : 'Sauvegarder'}
            </button>
          </form>
        </div>

        {/* Mot de passe */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Changer le mot de passe</h3>

          <form onSubmit={handleUpdatePassword}>
            <div className="form-group">
              <label>Ancien mot de passe</label>
              <input
                type="password"
                value={form.ancien_password}
                onChange={e => setForm({ ...form, ancien_password: e.target.value })}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <input
                type="password"
                value={form.nouveau_password}
                onChange={e => setForm({ ...form, nouveau_password: e.target.value })}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label>Confirmer le mot de passe</label>
              <input
                type="password"
                value={form.confirm_password}
                onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                required
                autoComplete="new-password"
              />
            </div>

            {successPassword && (
              <div style={{ padding: '0.75rem', backgroundColor: '#D1FAE5', borderRadius: '8px', marginBottom: '1rem' }}>
                <p style={{ color: 'var(--vert-foret)', fontSize: '0.85rem' }}>✅ Mot de passe modifié avec succès</p>
              </div>
            )}
            {errorPassword && <p className="error-message">{errorPassword}</p>}

            <button type="submit" className="btn btn-primary" disabled={loadingPassword}>
              {loadingPassword ? 'Modification...' : 'Modifier le mot de passe'}
            </button>
          </form>
        </div>

        {/* Statistiques */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Mon compte</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)' }}>Identifiant</p>
              <p style={{ fontWeight: 500 }}>#{user?.id}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)' }}>Statut</p>
              <span className="badge badge-success">Actif</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)' }}>Application</p>
              <p style={{ fontWeight: 500 }}>GLI-OCR v0.9.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profil;