import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Biens from './pages/Biens';
import Locataires from './pages/Locataires';
import Quittances from './pages/Quittances';
import './index.css';
import Monitoring from './pages/Monitoring';
import Paiements from './pages/Paiements';
import OCR from './pages/OCR';
import LocataireLogin from './pages/LocataireLogin';
import EspaceLocataire from './pages/EspaceLocataire';
import Profil from './pages/Profil';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="loading" role="status" aria-label="Chargement...">Chargement...</div>;
  if (!user) return <Navigate to="/login" />;
  return (
    <div className="layout">
      <Navbar />
      <main className="main-content" id="main-content">
        <a href="#main-content" className="sr-only">
          Aller au contenu principal
        </a>
        {children}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/biens" element={<PrivateRoute><Biens /></PrivateRoute>} />
          <Route path="/locataires" element={<PrivateRoute><Locataires /></PrivateRoute>} />
          <Route path="/quittances" element={<PrivateRoute><Quittances /></PrivateRoute>} />
          <Route path="/monitoring" element={<PrivateRoute><Monitoring /></PrivateRoute>} />
          <Route path="/paiements" element={<PrivateRoute><Paiements /></PrivateRoute>} />
          <Route path="/ocr" element={<PrivateRoute><OCR /></PrivateRoute>} />
          <Route path="/locataire-login" element={<LocataireLogin />} />
          <Route path="/espace-locataire" element={<EspaceLocataire />} />
          <Route path="/profil" element={<PrivateRoute><Profil /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;