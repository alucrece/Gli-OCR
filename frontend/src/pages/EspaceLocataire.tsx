import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LocataireInfo {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  date_entree: string;
  date_sortie: string | null;
  depot_garantie: number;
  bien_adresse: string;
  bien_ville: string;
  loyer_mensuel: number;
}

interface Quittance {
  id: number;
  mois: string;
  loyer: number;
  charges: number;
  total: number;
  date_paiement: string;
}

const EspaceLocataire: React.FC = () => {
  const [locataire, setLocataire] = useState<LocataireInfo | null>(null);
  const [quittances, setQuittances] = useState<Quittance[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem('locataire_token');

  useEffect(() => {
    if (!token) {
      navigate('/locataire-login');
      return;
    }
    const fetchData = async () => {
      try {
        const [meRes, qRes] = await Promise.all([
          fetch('http://localhost:8000/locataire/me', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('http://localhost:8000/locataire/quittances', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        if (!meRes.ok) {
          localStorage.removeItem('locataire_token');
          navigate('/locataire-login');
          return;
        }
        const meData = await meRes.json();
        const qData = await qRes.json();
        setLocataire(meData);
        setQuittances(qData);
      } catch {
        navigate('/locataire-login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ navigate, token]);

  const handleLogout = () => {
    localStorage.removeItem('locataire_token');
    navigate('/locataire-login');
  };

  const handleDownloadPdf = async (id: number, mois: string) => {
    try {
      const response = await fetch(`http://localhost:8000/quittances/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quittance_${mois}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Erreur lors du téléchargement.');
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--blanc-casse)' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'var(--bleu-nuit)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ color: 'white', fontSize: '1.25rem' }}>
          GLI<span style={{ color: 'var(--vert-foret)' }}>-OCR</span>
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginLeft: '1rem' }}>
            Espace locataire
          </span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
            {locataire?.prenom} {locataire?.nom}
          </p>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'rgba(255,255,255,0.6)',
              padding: '0.3rem 0.75rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>

        {/* Infos du logement */}
        <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bleu-nuit)', color: 'white' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'white' }}>
            Mon logement
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Adresse</p>
              <p style={{ fontWeight: 500 }}>{locataire?.bien_adresse}</p>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>{locataire?.bien_ville}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Loyer mensuel</p>
              <p style={{ fontFamily: 'var(--font-titre)', fontSize: '1.5rem', color: 'var(--vert-foret)', fontWeight: 600 }}>
                {locataire?.loyer_mensuel.toFixed(2)} €
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Date d'entrée</p>
              <p style={{ fontWeight: 500 }}>
                {locataire?.date_entree && new Date(locataire.date_entree).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Dépôt de garantie</p>
              <p style={{ fontWeight: 500, color: 'var(--dore)' }}>
                {locataire?.depot_garantie.toFixed(2)} €
              </p>
            </div>
          </div>
        </div>

        {/* Quittances */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            Mes quittances ({quittances.length})
          </h2>
          {quittances.length === 0 ? (
            <p style={{ color: 'var(--gris-ardoise)', textAlign: 'center', padding: '2rem' }}>
              Aucune quittance disponible pour le moment.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {quittances.map(q => (
                <div key={q.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: 'var(--blanc-casse)',
                  borderRadius: '8px',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div>
                    <p style={{ fontWeight: 500 }}>{q.mois}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)' }}>
                      Loyer : {q.loyer.toFixed(2)} € + Charges : {q.charges.toFixed(2)} €
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gris-ardoise)' }}>
                      Payé le {new Date(q.date_paiement).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <p style={{ fontFamily: 'var(--font-titre)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--dore)' }}>
                      {q.total.toFixed(2)} €
                    </p>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleDownloadPdf(q.id, q.mois)}
                    >
                      📄 Télécharger
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Note de bas de page */}
        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: 'var(--gris-ardoise)' }}>
          Pour toute question, contactez votre bailleur directement.
          <br />GLI-OCR — Gestion locative intelligente
        </p>
      </div>
    </div>
  );
};

export default EspaceLocataire;