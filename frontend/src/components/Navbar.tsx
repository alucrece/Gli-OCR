import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface Alerte {
  type: string;
  message: string;
  bien: string;
  niveau: string;
}

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [alertesLues, setAlertesLues] = useState<number[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAlertes = async () => {
      try {
        const response = await api.get('/dashboard/');
        setAlertes(response.data.alertes || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAlertes();
    const interval = setInterval(fetchAlertes, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const nbNonLues = alertes.filter((_, i) => !alertesLues.includes(i)).length;

  const alerteColor = (niveau: string) => {
    if (niveau === 'danger') return '#DC2626';
    if (niveau === 'warning') return '#D97706';
    return '#3B82F6';
  };

  const alerteIcon = (type: string) => {
    if (type === 'loyer_retard') return '🚨';
    if (type === 'loyer_manquant') return '⚠️';
    if (type === 'bail_expire') return '📅';
    return 'ℹ️';
  };

  const navItems = [
    { path: '/dashboard', label: 'Tableau de bord', icon: '📊' },
    { path: '/biens', label: 'Mes biens', icon: '🏠' },
    { path: '/locataires', label: 'Locataires', icon: '👤' },
    { path: '/quittances', label: 'Quittances', icon: '📄' },
    { path: '/paiements', label: 'Paiements', icon: '💰' },
    { path: '/ocr', label: 'Reconnaissance optique de caractères', icon: '🤖' },
    { path: '/monitoring', label: 'Monitoring', icon: '🔍' },
    { path: '/profil', label: 'Mon profil', icon: '⚙️' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>GLI<span>-OCR</span></h1>
        <p>Gestion locative intelligente</p>
      </div>

      <nav className="sidebar-nav" aria-label="Navigation principale">
        {navItems.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            aria-current={location.pathname === item.path ? 'page' : undefined}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              navigate(item.path);
            }}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="sidebar-footer">
        {/* Cloche notifications */}
        <div ref={notifRef} style={{ position: 'relative', marginBottom: '1rem' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: nbNonLues > 0 ? '#D97706' : 'rgba(255,255,255,0.5)',
              fontSize: '0.9rem',
              padding: '0.5rem 0',
              width: '100%'
            }}
            aria-label={`${nbNonLues} notification(s)`}
          >
            <span style={{ position: 'relative', fontSize: '1.2rem' }}>
              🔔
              {nbNonLues > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-8px',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {nbNonLues}
                </span>
              )}
            </span>
            <span style={{ fontSize: '0.85rem' }}>
              {nbNonLues > 0 ? `${nbNonLues} alerte(s)` : 'Aucune alerte'}
            </span>
          </button>

          {/* Panneau notifications */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              bottom: '2.5rem',
              left: 0,
              width: '300px',
              backgroundColor: '#1a2332',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              zIndex: 1000,
              overflow: 'hidden'
            }}>
              {/* Header panneau */}
              <div style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <p style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                  Notifications
                </p>
                {nbNonLues > 0 && (
                  <button
                    onClick={() => setAlertesLues(alertes.map((_, i) => i))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--vert-foret)',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Tout marquer lu
                  </button>
                )}
              </div>

              {/* Liste alertes */}
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {alertes.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✅</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                      Tout est en ordre !
                    </p>
                  </div>
                ) : (
                  alertes.map((alerte, i) => {
                    const lue = alertesLues.includes(i);
                    return (
                      <div
                        key={i}
                        style={{
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          backgroundColor: lue ? 'transparent' : 'rgba(255,255,255,0.03)',
                          display: 'flex',
                          gap: '0.75rem',
                          alignItems: 'flex-start'
                        }}
                      >
                        <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                          {alerteIcon(alerte.type)}
                        </span>
                        <div style={{ flex: 1 }}>
                          <p style={{
                            fontSize: '0.8rem',
                            color: lue ? 'rgba(255,255,255,0.4)' : 'white',
                            marginBottom: '0.2rem',
                            lineHeight: 1.3
                          }}>
                            {alerte.message}
                          </p>
                          <p style={{
                            fontSize: '0.7rem',
                            color: alerteColor(alerte.niveau),
                            opacity: lue ? 0.5 : 1
                          }}>
                            🏠 {alerte.bien}
                          </p>
                        </div>
                        {!lue && (
                          <button
                            onClick={() => setAlertesLues([...alertesLues, i])}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'rgba(255,255,255,0.3)',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              flexShrink: 0,
                              padding: 0
                            }}
                            aria-label="Marquer comme lu"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {alertes.length > 0 && (
                <div style={{
                  padding: '0.5rem 1rem',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  textAlign: 'center'
                }}>
                  <button
                    onClick={() => { navigate('/dashboard'); setShowNotifications(false); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--vert-foret)',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Voir le tableau de bord →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
          {user?.prenom} {user?.nom}
        </p>
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            padding: 0,
            marginTop: '0.5rem'
          }}
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
};

export default Navbar;