import React, { useEffect, useState } from 'react';
import api from '../api/axios';

interface Paiement {
  id: number;
  locataire_id: number;
  bien_id: number;
  mois: string;
  montant: number;
  statut: string;
  date_paiement: string | null;
  note: string | null;
  created_at: string;
}

interface Bien {
  id: number;
  adresse: string;
  ville: string;
  loyer_mensuel: number;
}

interface Locataire {
  id: number;
  nom: string;
  prenom: string;
  bien_id: number;
}

const MOIS_OPTIONS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const ANNEE_COURANTE = new Date().getFullYear();

const Paiements: React.FC = () => {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    bien_id: '',
    locataire_id: '',
    mois: `${MOIS_OPTIONS[new Date().getMonth()]} ${ANNEE_COURANTE}`,
    montant: '',
    statut: 'paye',
    note: ''
  });
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [pRes, bRes, lRes] = await Promise.all([
        api.get('/paiements/'),
        api.get('/biens/'),
        api.get('/locataires/')
      ]);
      setPaiements(pRes.data);
      setBiens(bRes.data);
      setLocataires(lRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getLocatairesByBien = (bien_id: string) => {
    return locataires.filter(l => l.bien_id === parseInt(bien_id));
  };

  const getBienAdresse = (bien_id: number) => {
    const bien = biens.find(b => b.id === bien_id);
    return bien ? `${bien.adresse}, ${bien.ville}` : 'Inconnu';
  };

  const getLocataireName = (locataire_id: number) => {
    const loc = locataires.find(l => l.id === locataire_id);
    return loc ? `${loc.prenom} ${loc.nom}` : 'Inconnu';
  };

  const handleBienChange = (bien_id: string) => {
    const bien = biens.find(b => b.id === parseInt(bien_id));
    setForm({
      ...form,
      bien_id,
      locataire_id: '',
      montant: bien ? bien.loyer_mensuel.toString() : ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/paiements/', {
        ...form,
        bien_id: parseInt(form.bien_id),
        locataire_id: parseInt(form.locataire_id),
        montant: parseFloat(form.montant)
      });
      setForm({
        bien_id: '',
        locataire_id: '',
        mois: `${MOIS_OPTIONS[new Date().getMonth()]} ${ANNEE_COURANTE}`,
        montant: '',
        statut: 'paye',
        note: ''
      });
      setShowForm(false);
      fetchData();
    } catch {
      setError('Erreur lors de l\'enregistrement du paiement.');
    }
  };

  const handleUpdateStatut = async (id: number, statut: string) => {
    try {
      await api.put(`/paiements/${id}`, { statut });
      fetchData();
    } catch {
      alert('Erreur lors de la mise à jour.');
    }
  };

  const statutColor = (statut: string) => {
    if (statut === 'paye') return { bg: 'D1FAE5', text: '065F46' };
    if (statut === 'en_retard') return { bg: 'FEE2E2', text: '991B1B' };
    return { bg: 'FEF3C7', text: '92400E' };
  };

  const statutLabel = (statut: string) => {
    if (statut === 'paye') return '✅ Payé';
    if (statut === 'en_retard') return '🚨 En retard';
    return '⏳ En attente';
  };

  const totalEncaisse = paiements.filter(p => p.statut === 'paye').reduce((sum, p) => sum + p.montant, 0);
  const totalEnAttente = paiements.filter(p => p.statut !== 'paye').reduce((sum, p) => sum + p.montant, 0);

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
            <h2>Paiements de loyer</h2>
            <p>{paiements.length} paiement(s) enregistré(s)</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
            className="btn btn-secondary"
            onClick={async () => {
                const annee = new Date().getFullYear();
                try {
                const response = await api.get(`/export/fiscal/${annee}`, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `fiscal_${annee}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                } catch {
                alert('Erreur lors de la génération du PDF fiscal.');
                }
            }}
            >
            📊 Export fiscal {new Date().getFullYear()}
            </button>
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '+ Enregistrer un paiement'}
            </button>
        </div>
        </div>

      {/* Métriques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid var(--vert-foret)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)', marginBottom: '0.5rem' }}>Total encaissé</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--vert-foret)' }}>{totalEncaisse.toFixed(2)} €</p>
        </div>
        <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid var(--dore)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)', marginBottom: '0.5rem' }}>En attente / retard</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--dore)' }}>{totalEnAttente.toFixed(2)} €</p>
        </div>
        <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid var(--bleu-nuit)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)', marginBottom: '0.5rem' }}>Taux de recouvrement</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--bleu-nuit)' }}>
            {paiements.length > 0 ? Math.round(paiements.filter(p => p.statut === 'paye').length / paiements.length * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Enregistrer un paiement</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Bien</label>
                <select value={form.bien_id} onChange={e => handleBienChange(e.target.value)} required>
                  <option value="">Sélectionner un bien</option>
                  {biens.map(b => (
                    <option key={b.id} value={b.id}>{b.adresse}, {b.ville}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Locataire</label>
                <select value={form.locataire_id} onChange={e => setForm({ ...form, locataire_id: e.target.value })} required disabled={!form.bien_id}>
                  <option value="">Sélectionner un locataire</option>
                  {getLocatairesByBien(form.bien_id).map(l => (
                    <option key={l.id} value={l.id}>{l.prenom} {l.nom}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Période</label>
                <input
                  type="text"
                  value={form.mois}
                  onChange={e => setForm({ ...form, mois: e.target.value })}
                  placeholder="ex : Août 2026"
                  required
                />
              </div>
              <div className="form-group">
                <label>Montant (€)</label>
                <input
                  type="number"
                  value={form.montant}
                  onChange={e => setForm({ ...form, montant: e.target.value })}
                  placeholder="1200"
                  required
                />
              </div>
              <div className="form-group">
                <label>Statut</label>
                <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                  <option value="paye">Payé</option>
                  <option value="en_attente">En attente</option>
                  <option value="en_retard">En retard</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Note (optionnel)</label>
              <input type="text" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Virement reçu le..." />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="btn btn-primary">Enregistrer</button>
          </form>
        </div>
      )}

      {/* Liste paiements */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {paiements.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--gris-ardoise)' }}>Aucun paiement enregistré.</p>
          </div>
        ) : (
          paiements.map(p => {
            const colors = statutColor(p.statut);
            return (
              <div key={p.id} className="card" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                borderLeft: `4px solid #${colors.text}`
              }}>
                <div>
                  <p style={{ fontWeight: 500 }}>{p.mois}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gris-ardoise)' }}>
                    👤 {getLocataireName(p.locataire_id)}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)' }}>
                    🏠 {getBienAdresse(p.bien_id)}
                  </p>
                  {p.note && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--gris-ardoise)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                      📝 {p.note}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'var(--font-titre)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--dore)' }}>
                      {p.montant.toFixed(2)} €
                    </p>
                    {p.date_paiement && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--gris-ardoise)' }}>
                        Reçu le {new Date(p.date_paiement).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                  <span style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    backgroundColor: `#${colors.bg}`,
                    color: `#${colors.text}`
                  }}>
                    {statutLabel(p.statut)}
                  </span>
                  {p.statut !== 'paye' && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                      onClick={() => handleUpdateStatut(p.id, 'paye')}
                    >
                      Marquer payé
                    </button>
                  )}
                  {p.statut === 'en_attente' && (
                    <button
                      className="btn btn-danger"
                      style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                      onClick={() => handleUpdateStatut(p.id, 'en_retard')}
                    >
                      Retard
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Paiements;