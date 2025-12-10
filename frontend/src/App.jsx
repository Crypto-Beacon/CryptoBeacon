import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import ForgotPassword from './pages/ForgotPassword';
import HomePage from './pages/HomePage';
import CryptoDetailPage from './pages/CryptoDetailPage';
import PortfolioPage from './pages/PortfolioPage';
import WishlistPage from './pages/WishlistPage';

import SettingsPage from './pages/SettingsPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Public Route Component (redirects to home if already logged in)
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - Accessible only when NOT logged in */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/verify-otp" element={<PublicRoute><VerifyOTP /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <HomePage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/crypto/:symbol"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <CryptoDetailPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/portfolio"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <PortfolioPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <WishlistPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <SettingsPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* Redirect /dashboard to /portfolio for backwards compatibility */}
        <Route path="/dashboard" element={<Navigate to="/portfolio" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
