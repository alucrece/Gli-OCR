import React, { useEffect, useState } from 'react';
import api from '../api/axios';

interface Quittance {
  id: number;
  locataire_id: number;
  bien_id: number;
  mois: string;
  loyer: number;
  charges: number;
  total: number;
  date_paiement: string;
  created_at: string;
}

interface Bien {
  id: number;
  adresse: string;
  ville: string;
}

interface Locataire {
  id: number;
  nom: string;
  prenom: string;
  bien_id: number;
}

const Quittances: React.FC = () => {
  const [quittances, setQuittances] = useState<Quittance[]>([]);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    locataire_id: '',
    bien_id: '',
    mois: '',
    loyer: '',
    charges: '',
    date_paiement: ''
  });
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [qRes, bRes, lRes] = await Promise.all([
        api.get('/quittances/'),
        api.get('/biens/'),
        api.get('/locataires/')
      ]);
      setQuittances(qRes.data);
      setBiens(bRes.data);
      setLocataires(lRes.data);
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
      await api.post('/quittances/', {
        ...form,
        locataire_id: parseInt(form.locataire_id),
        bien_id: parseInt(form.bien_id),
        loyer: parseFloat(form.loyer),
        charges: parseFloat(form.charges)
      });
      setForm({ locataire_id: '', bien_id: '', mois: '', loyer: '', charges: '', date_paiement: '' });
      setShowForm(false);
      fetchData();
    } catch {
      setError('Erreur lors de la création de la quittance.');
    }
  };

  const handleDownloadPdf = async (id: number, mois: string, locataire_id: number) => {
    try {
      const response = await api.get(`/quittances/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      const locataire = locataires.find(l => l.id === locataire_id);
      link.href = url;
      link.setAttribute('download', `quittance_${mois}_${locataire?.nom || 'locataire'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Erreur lors du téléchargement du PDF.');
    }
  };

  const getBienAdresse = (bien_id: number) => {
    const bien = biens.find(b => b.id === bien_id);
    return bien ? `${bien.adresse}, ${bien.ville}` : 'Bien inconnu';
  };

  const getLocataireName = (locataire_id: number) => {
    const loc = locataires.find(l => l.id === locataire_id);
    return loc ? `${loc.prenom} ${loc.nom}` : 'Inconnu';
  };

  const getLocatairesByBien = (bien_id: string) => {
    return locataires.filter(l => l.bien_id === parseInt(bien_id));
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Quittances</h2>
          <p>{quittances.length} quittance(s) générée(s)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Générer une quittance'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Nouvelle quittance</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Bien</label>
              <select
                value={form.bien_id}
                onChange={e => setForm({ ...form, bien_id: e.target.value, locataire_id: '' })}
                required
              >
                <option value="">Sélectionner un bien</option>
                {biens.map(bien => (
                  <option key={bien.id} value={bien.id}>
                    {bien.adresse}, {bien.ville}
                  </option>
                ))}
              </select>
            </div>

            {form.bien_id && (
              <div className="form-group">
                <label>Locataire</label>
                <select
                  value={form.locataire_id}
                  onChange={e => setForm({ ...form, locataire_id: e.target.value })}
                  required
                >
                  <option value="">Sélectionner un locataire</option>
                  {getLocatairesByBien(form.bien_id).map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.prenom} {loc.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Période (ex: Juillet 2026)</label>
                <input
                  type="text"
                  value={form.mois}
                  onChange={e => setForm({ ...form, mois: e.target.value })}
                  placeholder="Juillet 2026"
                  required
                />
              </div>
              <div className="form-group">
                <label>Date de paiement</label>
                <input
                  type="date"
                  value={form.date_paiement}
                  onChange={e => setForm({ ...form, date_paiement: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Loyer (€)</label>
                <input
                  type="number"
                  value={form.loyer}
                  onChange={e => setForm({ ...form, loyer: e.target.value })}
                  placeholder="1200"
                  required
                />
              </div>
              <div className="form-group">
                <label>Charges (€)</label>
                <input
                  type="number"
                  value={form.charges}
                  onChange={e => setForm({ ...form, charges: e.target.value })}
                  placeholder="150"
                  required
                />
              </div>
            </div>

            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="btn btn-primary">Générer</button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {quittances.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--gris-ardoise)' }}>Aucune quittance générée.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowForm(true)}>
              Générer ma première quittance
            </button>
          </div>
        ) : (
          quittances.map((q) => (
            <div key={q.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontWeight: 500, fontSize: '1rem' }}>{q.mois}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--gris-ardoise)' }}>
                  👤 {getLocataireName(q.locataire_id)}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)' }}>
                  🏠 {getBienAdresse(q.bien_id)}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <p className="montant">{q.total.toFixed(2)} €</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gris-ardoise)' }}>
                    {q.loyer.toFixed(2)} € + {q.charges.toFixed(2)} € charges
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gris-ardoise)' }}>
                    Payé le {new Date(q.date_paiement).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleDownloadPdf(q.id, q.mois, q.locataire_id)}
                >
                  📄 PDF
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Quittances;