import React, { useEffect, useState } from 'react';
import api from '../api/axios';

interface Bien {
  id: number;
  adresse: string;
  ville: string;
  code_postal: string;
  surface: number;
  loyer_mensuel: number;
  charges_mensuelles: number;
  owner_id: number;
  created_at: string;
}

const Biens: React.FC = () => {
  const [biens, setBiens] = useState<Bien[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    adresse: '',
    ville: '',
    code_postal: '',
    surface: '',
    loyer_mensuel: '',
    charges_mensuelles: ''
  });
  const [error, setError] = useState('');

  const fetchBiens = async () => {
    try {
      const response = await api.get('/biens/');
      setBiens(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBiens(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/biens/', {
        ...form,
        surface: parseFloat(form.surface),
        loyer_mensuel: parseFloat(form.loyer_mensuel),
        charges_mensuelles: parseFloat(form.charges_mensuelles)
      });
      setForm({ adresse: '', ville: '', code_postal: '', surface: '', loyer_mensuel: '', charges_mensuelles: '' });
      setShowForm(false);
      fetchBiens();
    } catch {
      setError('Erreur lors de la création du bien.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce bien ?')) return;
    try {
      await api.delete(`/biens/${id}`);
      fetchBiens();
    } catch {
      alert('Erreur lors de la suppression.');
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Mes biens</h2>
          <p>{biens.length} bien(s) enregistré(s)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Ajouter un bien'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Nouveau bien</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Adresse</label>
              <input type="text" value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} placeholder="12 rue de la Paix" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Ville</label>
                <input type="text" value={form.ville} onChange={e => setForm({...form, ville: e.target.value})} placeholder="Paris" required />
              </div>
              <div className="form-group">
                <label>Code postal</label>
                <input type="text" value={form.code_postal} onChange={e => setForm({...form, code_postal: e.target.value})} placeholder="75001" required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Surface (m²)</label>
                <input type="number" value={form.surface} onChange={e => setForm({...form, surface: e.target.value})} placeholder="45" required />
              </div>
              <div className="form-group">
                <label>Loyer mensuel (€)</label>
                <input type="number" value={form.loyer_mensuel} onChange={e => setForm({...form, loyer_mensuel: e.target.value})} placeholder="1200" required />
              </div>
              <div className="form-group">
                <label>Charges (€)</label>
                <input type="number" value={form.charges_mensuelles} onChange={e => setForm({...form, charges_mensuelles: e.target.value})} placeholder="150" required />
              </div>
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="btn btn-primary">Enregistrer</button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {biens.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--gris-ardoise)' }}>Aucun bien enregistré.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowForm(true)}>
              Ajouter mon premier bien
            </button>
          </div>
        ) : (
          biens.map((bien) => (
            <div key={bien.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontWeight: 500, fontSize: '1rem' }}>{bien.adresse}</p>
                <p style={{ color: 'var(--gris-ardoise)', fontSize: '0.85rem' }}>
                  {bien.code_postal} {bien.ville} — {bien.surface} m²
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <p className="montant">{bien.loyer_mensuel.toFixed(2)} €</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gris-ardoise)' }}>
                    + {bien.charges_mensuelles.toFixed(2)} € charges
                  </p>
                </div>
                <button className="btn btn-danger" onClick={() => handleDelete(bien.id)}>
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

export default Biens;