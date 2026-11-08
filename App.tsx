
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PublicBooking } from './pages/PublicBooking';
import { Settings } from './pages/Settings';
import { Professionals } from './pages/Professionals';
import { Appointments } from './pages/Appointments';
import { Services } from './pages/Services';
import { Revenue } from './pages/Revenue';
import { SocialLinks } from './pages/SocialLinks';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <HashRouter>
        <div className="img-scroll">
          <div data-simplebar="true" style={{ maxHeight: '100vh', overflowY: 'auto' }}>
            <Routes>
              {/* Rota Pública Principal */}
              <Route path="/" element={<PublicBooking />} />
              <Route path="/booking/:slug" element={<PublicBooking />} />
              <Route path="/login" element={<Login />} />
              
              {/* Painel Administrativo Protegido */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <Layout><Dashboard /></Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/appointments" element={
                <ProtectedRoute>
                  <Layout><Appointments /></Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/professionals" element={
                <ProtectedRoute>
                  <Layout><Professionals /></Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/services" element={
                <ProtectedRoute>
                  <Layout><Services /></Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/revenue" element={
                <ProtectedRoute>
                  <Layout><Revenue /></Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/social" element={
                <ProtectedRoute>
                  <Layout><SocialLinks /></Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Layout><Settings /></Layout>
                </ProtectedRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;
