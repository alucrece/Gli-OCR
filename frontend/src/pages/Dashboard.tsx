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

interface Alerte {
  type: string;
  message: string;
  bien: string;
  niveau: string;
}

interface HistoriqueMois {
  mois: string;
  total: number;
  nb_paiements: number;
}

interface DashboardData {
  nb_biens: number;
  nb_locataires_actifs: number;
  loyers_mensuels_total: number;
  charges_mensuelles_total: number;
  revenu_net_mensuel: number;
  taux_occupation: number;
  alertes: Alerte[];
  historique_6_mois: HistoriqueMois[];
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

  const alerteColor = (niveau: string) => {
    if (niveau === 'danger') return { bg: '#FEE2E2', border: '#DC2626', text: '#991B1B' };
    if (niveau === 'warning') return { bg: '#FEF3C7', border: '#D97706', text: '#92400E' };
    return { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' };
  };

  const alerteIcon = (type: string) => {
    if (type === 'loyer_retard') return '🚨';
    if (type === 'loyer_manquant') return '⚠️';
    if (type === 'bail_expire') return '📅';
    return 'ℹ️';
  };

  const maxHistorique = Math.max(...(data?.historique_6_mois.map(h => h.total) || [1]), 1);

  return (
    <div>
      <div className="page-header">
        <h2>Bonjour, {user?.prenom} </h2>
        <p>Voici un aperçu de votre patrimoine locatif</p>
      </div>

      {/* Alertes */}
      {data && data.alertes.length > 0 && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {data.alertes.map((alerte, index) => {
            const colors = alerteColor(alerte.niveau);
            return (
              <div key={index} style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: colors.bg,
                borderLeft: `4px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span>{alerteIcon(alerte.type)}</span>
                <p style={{ fontSize: '0.85rem', color: colors.text, fontWeight: 500 }}>
                  {alerte.message}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Hero revenu net */}
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
          <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)', marginBottom: '0.5rem' }}>Biens gérés</p>
          <p style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--bleu-nuit)' }}>{data?.nb_biens}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)', marginBottom: '0.5rem' }}>Locataires actifs</p>
          <p style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--bleu-nuit)' }}>{data?.nb_locataires_actifs}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)', marginBottom: '0.5rem' }}>Taux d'occupation</p>
          <p style={{ fontSize: '2rem', fontWeight: 600, color: data && data.taux_occupation >= 80 ? 'var(--vert-foret)' : 'var(--dore)' }}>
            {data?.taux_occupation}%
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)', marginBottom: '0.5rem' }}>Alertes actives</p>
          <p style={{ fontSize: '2rem', fontWeight: 600, color: data && data.alertes.length > 0 ? '#DC2626' : 'var(--vert-foret)' }}>
            {data?.alertes.length}
          </p>
        </div>
      </div>

      {/* Graphique historique 6 mois */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Loyers encaissés sur les 6 derniers mois</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '150px' }}>
          {data?.historique_6_mois.map((h, index) => (
            <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--gris-ardoise)', fontWeight: 500 }}>
                {h.total > 0 ? `${h.total}€` : '-'}
              </p>
              <div style={{
                width: '100%',
                backgroundColor: h.total > 0 ? 'var(--vert-foret)' : 'var(--gris-clair)',
                borderRadius: '4px 4px 0 0',
                height: `${Math.max((h.total / maxHistorique) * 120, h.total > 0 ? 10 : 4)}px`,
                transition: 'height 0.3s ease'
              }} />
              <p style={{ fontSize: '0.65rem', color: 'var(--gris-ardoise)', textAlign: 'center' }}>
                {h.mois.split(' ')[0].substring(0, 3)}
              </p>
            </div>
          ))}
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
                borderLeft: `4px solid ${bien.statut === 'occupé' ? 'var(--vert-foret)' : 'var(--dore)'}`,
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