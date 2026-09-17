import React, { useEffect, useState } from 'react';
import api from '../api/axios';

interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
  services: {
    database: { status: string; message: string };
    storage: { status: string; message: string };
  };
}

interface Metrics {
  timestamp: string;
  application: string;
  version: string;
  metrics: {
    users_total: number;
    biens_total: number;
    locataires_total: number;
    quittances_total: number;
    locataires_actifs: number;
  };
}

interface Anomalie {
  id: number;
  titre: string;
  description: string;
  module: string;
  criticite: string;
  statut: string;
  etapes_reproduction: string | null;
  correctif: string | null;
  created_at: string;
  resolved_at: string | null;
}

const Monitoring: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [anomalies, setAnomalies] = useState<Anomalie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    titre: '',
    description: '',
    module: '',
    criticite: 'mineur',
    etapes_reproduction: ''
  });

  const fetchData = async () => {
    try {
      const [healthRes, metricsRes, anomaliesRes] = await Promise.all([
        api.get('/health/'),
        api.get('/health/metrics'),
        api.get('/anomalies/')
      ]);
      setHealth(healthRes.data);
      setMetrics(metricsRes.data);
      setAnomalies(anomaliesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/anomalies/', form);
      setForm({ titre: '', description: '', module: '', criticite: 'mineur', etapes_reproduction: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (id: number) => {
    const correctif = prompt('Décrivez le correctif appliqué :');
    if (!correctif) return;
    try {
      await api.put(`/anomalies/${id}`, { statut: 'resolu', correctif });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const statusColor = (status: string) => {
    if (status === 'up' || status === 'healthy' || status === 'resolu') return 'var(--vert-foret)';
    if (status === 'warning') return 'var(--dore)';
    return '#dc2626';
  };

  const criticiteColor = (criticite: string) => {
    if (criticite === 'bloquant') return { bg: 'FEE2E2', text: '991B1B' };
    if (criticite === 'majeur') return { bg: 'FEF3C7', text: '92400E' };
    return { bg: 'D1FAE5', text: '065F46' };
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Monitoring & Supervision</h2>
          <p>État de l'application en temps réel - actualisation toutes les 30 secondes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Signaler une anomalie'}
        </button>
      </div>

      {/* Health Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ borderLeft: `4px solid ${statusColor(health?.status || '')}` }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)' }}>Statut global</p>
          <p style={{ fontSize: '1.25rem', fontWeight: 600, color: statusColor(health?.status || '') }}>
            {health?.status === 'healthy' ? '✅ Opérationnel' : '❌ Dégradé'}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--gris-ardoise)', marginTop: '0.25rem' }}>
            v{health?.version}
          </p>
        </div>

        <div className="card" style={{ borderLeft: `4px solid ${statusColor(health?.services.database.status || '')}` }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)' }}>Base de données</p>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: statusColor(health?.services.database.status || '') }}>
            {health?.services.database.status === 'up' ? '✅ PostgreSQL' : '❌ Hors ligne'}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--gris-ardoise)' }}>{health?.services.database.message}</p>
        </div>

        <div className="card" style={{ borderLeft: `4px solid ${statusColor(health?.services.storage.status || '')}` }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)' }}>Stockage</p>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: statusColor(health?.services.storage.status || '') }}>
            {health?.services.storage.status === 'up' ? '✅ MinIO' : '⚠️ Warning'}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--gris-ardoise)' }}>{health?.services.storage.message}</p>
        </div>

        <div className="card">
          <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)' }}>Anomalies ouvertes</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 600, color: anomalies.filter(a => a.statut === 'ouvert').length > 0 ? '#dc2626' : 'var(--vert-foret)' }}>
            {anomalies.filter(a => a.statut === 'ouvert').length}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--gris-ardoise)' }}>
            {anomalies.filter(a => a.statut === 'resolu').length} résolue(s)
          </p>
        </div>
      </div>

      {/* Métriques */}
      {metrics && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Métriques applicatives</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Utilisateurs', value: metrics.metrics.users_total },
              { label: 'Biens', value: metrics.metrics.biens_total },
              { label: 'Locataires', value: metrics.metrics.locataires_total },
              { label: 'Locataires actifs', value: metrics.metrics.locataires_actifs },
              { label: 'Quittances', value: metrics.metrics.quittances_total }
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--bleu-nuit)' }}>{value}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--gris-ardoise)' }}>{label}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--gris-ardoise)', marginTop: '0.5rem', textAlign: 'right' }}>
            Dernière mise à jour : {new Date(metrics.timestamp).toLocaleString('fr-FR')}
          </p>
        </div>
      )}

      {/* Formulaire anomalie */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Signaler une anomalie</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Titre</label>
              <input type="text" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} placeholder="Titre de l'anomalie" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Module concerné</label>
                <select value={form.module} onChange={e => setForm({ ...form, module: e.target.value })} required>
                  <option value="">Sélectionner</option>
                  <option value="Authentification">Authentification</option>
                  <option value="Biens">Biens</option>
                  <option value="Locataires">Locataires</option>
                  <option value="Quittances">Quittances</option>
                  <option value="Dashboard">Dashboard</option>
                  <option value="OCR">OCR</option>
                  <option value="Infrastructure">Infrastructure</option>
                </select>
              </div>
              <div className="form-group">
                <label>Criticité</label>
                <select value={form.criticite} onChange={e => setForm({ ...form, criticite: e.target.value })}>
                  <option value="mineur">Mineur</option>
                  <option value="majeur">Majeur</option>
                  <option value="bloquant">Bloquant</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description détaillée" required />
            </div>
            <div className="form-group">
              <label>Étapes de reproduction</label>
              <input type="text" value={form.etapes_reproduction} onChange={e => setForm({ ...form, etapes_reproduction: e.target.value })} placeholder="1. Étape 1 2. Étape 2..." />
            </div>
            <button type="submit" className="btn btn-primary">Consigner</button>
          </form>
        </div>
      )}

      {/* Liste anomalies */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>
          Journal des anomalies ({anomalies.length})
        </h3>
        {anomalies.length === 0 ? (
          <p style={{ color: 'var(--gris-ardoise)' }}>Aucune anomalie signalée.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {anomalies.map(a => {
              const colors = criticiteColor(a.criticite);
              return (
                <div key={a.id} style={{
                  padding: '1rem',
                  background: 'var(--blanc-casse)',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${a.statut === 'resolu' ? 'var(--vert-foret)' : '#dc2626'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <p style={{ fontWeight: 500 }}>{a.titre}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)' }}>{a.description}</p>
                      {a.etapes_reproduction && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--gris-ardoise)', marginTop: '0.25rem' }}>
                          📋 {a.etapes_reproduction}
                        </p>
                      )}
                      {a.correctif && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--vert-foret)', marginTop: '0.25rem' }}>
                          ✅ Correctif : {a.correctif}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        backgroundColor: `#${colors.bg}`,
                        color: `#${colors.text}`
                      }}>
                        {a.criticite}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gris-ardoise)' }}>{a.module}</span>
                      <span className={`badge ${a.statut === 'resolu' ? 'badge-success' : 'badge-warning'}`}>
                        {a.statut}
                      </span>
                      {a.statut !== 'resolu' && (
                        <button className="btn btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => handleResolve(a.id)}>
                          Résoudre
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--gris-ardoise)', marginTop: '0.5rem' }}>
                    Signalé le {new Date(a.created_at).toLocaleString('fr-FR')}
                    {a.resolved_at && ` — Résolu le ${new Date(a.resolved_at).toLocaleString('fr-FR')}`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Monitoring;