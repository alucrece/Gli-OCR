import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface BienDashboard {
  id: number;
  adresse: string;
  ville: string;
  loyer_mensuel: number;
  charges_mensuelles: number;
  statut: string;
  locataire: string | null;
}

interface DashboardData {
  nb_biens: number;
  nb_locataires_actifs: number;
  loyers_mensuels_total: number;
  charges_mensuelles_total: number;
  revenu_net_mensuel: number;
  biens: BienDashboard[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard/');
        setData(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Bonjour, {user?.prenom} </h2>
        <p>Voici un aperçu de votre patrimoine locatif</p>
      </div>

      {/* Hero — revenu net */}
      <div className="card" style={{
        marginBottom: '1.5rem',
        background: 'var(--bleu-nuit)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
            Revenu net mensuel
          </p>
          <p style={{
            fontFamily: 'var(--font-titre)',
            fontSize: '3rem',
            fontWeight: 600,
            color: 'var(--vert-foret)'
          }}>
            {data?.revenu_net_mensuel.toFixed(2)} €
          </p>
        </div>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Loyers bruts</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--dore)' }}>
              {data?.loyers_mensuels_total.toFixed(2)} €
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Charges</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 500, color: '#f87171' }}>
              -{data?.charges_mensuelles_total.toFixed(2)} €
            </p>
          </div>
        </div>
      </div>

      {/* Métriques */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)', marginBottom: '0.5rem' }}>
            Biens gérés
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--bleu-nuit)' }}>
            {data?.nb_biens}
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)', marginBottom: '0.5rem' }}>
            Locataires actifs
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--bleu-nuit)' }}>
            {data?.nb_locataires_actifs}
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)', marginBottom: '0.5rem' }}>
            Biens vacants
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--bleu-nuit)' }}>
            {(data?.nb_biens || 0) - (data?.nb_locataires_actifs || 0)}
          </p>
        </div>
      </div>

      {/* Liste des biens */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Mes biens</h3>
        {data?.biens.length === 0 ? (
          <p style={{ color: 'var(--gris-ardoise)', fontSize: '0.9rem' }}>
            Aucun bien enregistré. Ajoutez votre premier bien !
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {data?.biens.map((bien) => (
              <div key={bien.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                background: 'var(--blanc-casse)',
                borderRadius: '8px',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div>
                  <p style={{ fontWeight: 500 }}>{bien.adresse}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)' }}>{bien.ville}</p>
                  {bien.locataire && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--vert-foret)', marginTop: '0.25rem' }}>
                      👤 {bien.locataire}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="montant">{bien.loyer_mensuel.toFixed(2)} €/mois</p>
                  <span className={`badge ${bien.statut === 'occupé' ? 'badge-success' : 'badge-warning'}`}>
                    {bien.statut}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;