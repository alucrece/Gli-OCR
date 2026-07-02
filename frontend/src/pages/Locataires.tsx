import React, { useEffect, useState } from 'react';
import api from '../api/axios';

interface Locataire {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  date_entree: string;
  date_sortie: string | null;
  depot_garantie: number;
  bien_id: number;
}

interface Bien {
  id: number;
  adresse: string;
  ville: string;
}

const Locataires: React.FC = () => {
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    date_entree: '',
    depot_garantie: '',
    bien_id: ''
  });
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [locRes, bienRes] = await Promise.all([
        api.get('/locataires/'),
        api.get('/biens/')
      ]);
      setLocataires(locRes.data);
      setBiens(bienRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/locataires/', {
        ...form,
        depot_garantie: parseFloat(form.depot_garantie),
        bien_id: parseInt(form.bien_id)
      });
      setForm({ nom: '', prenom: '', email: '', telephone: '', date_entree: '', depot_garantie: '', bien_id: '' });
      setShowForm(false);
      fetchData();
    } catch {
      setError('Erreur lors de la création du locataire.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce locataire ?')) return;
    try {
      await api.delete(`/locataires/${id}`);
      fetchData();
    } catch {
      alert('Erreur lors de la suppression.');
    }
  };

  const getBienAdresse = (bien_id: number) => {
    const bien = biens.find(b => b.id === bien_id);
    return bien ? `${bien.adresse}, ${bien.ville}` : 'Bien inconnu';
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Locataires</h2>
          <p>{locataires.length} locataire(s) enregistré(s)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Ajouter un locataire'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Nouveau locataire</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Prénom</label>
                <input type="text" value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} placeholder="Jean" required />
              </div>
              <div className="form-group">
                <label>Nom</label>
                <input type="text" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Dupont" required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="jean@email.com" required />
              </div>
              <div className="form-group">
                <label>Téléphone</label>
                <input type="tel" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} placeholder="0612345678" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Date d'entrée</label>
                <input type="date" value={form.date_entree} onChange={e => setForm({...form, date_entree: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Dépôt de garantie (€)</label>
                <input type="number" value={form.depot_garantie} onChange={e => setForm({...form, depot_garantie: e.target.value})} placeholder="2400" required />
              </div>
            </div>
            <div className="form-group">
              <label>Bien associé</label>
              <select value={form.bien_id} onChange={e => setForm({...form, bien_id: e.target.value})} required>
                <option value="">Sélectionner un bien</option>
                {biens.map(bien => (
                  <option key={bien.id} value={bien.id}>
                    {bien.adresse}, {bien.ville}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="btn btn-primary">Enregistrer</button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {locataires.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--gris-ardoise)' }}>Aucun locataire enregistré.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowForm(true)}>
              Ajouter mon premier locataire
            </button>
          </div>
        ) : (
          locataires.map((loc) => (
            <div key={loc.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontWeight: 500 }}>{loc.prenom} {loc.nom}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--gris-ardoise)' }}>{loc.email}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)', marginTop: '0.25rem' }}>
                  🏠 {getBienAdresse(loc.bien_id)}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)' }}>Entrée</p>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                    {new Date(loc.date_entree).toLocaleDateString('fr-FR')}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gris-ardoise)' }}>
                    DG : {loc.depot_garantie.toFixed(2)} €
                  </p>
                </div>
                <span className={`badge ${!loc.date_sortie ? 'badge-success' : 'badge-warning'}`}>
                  {!loc.date_sortie ? 'Actif' : 'Parti'}
                </span>
                <button className="btn btn-danger" onClick={() => handleDelete(loc.id)}>
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Locataires;