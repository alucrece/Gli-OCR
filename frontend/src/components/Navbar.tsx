import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Tableau de bord', icon: '📊' },
    { path: '/biens', label: 'Mes biens', icon: '🏠' },
    { path: '/locataires', label: 'Locataires', icon: '👤' },
    { path: '/quittances', label: 'Quittances', icon: '📄' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>GLI<span>-OCR</span></h1>
        <p>Gestion locative intelligente</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              navigate(item.path);
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>{user?.prenom} {user?.nom}</p>
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