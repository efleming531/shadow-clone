import React from 'react';
import { Navigate } from 'react-router-dom';

// PortalRoute: simple wrapper for customer portal routes
// Checks for forge_token in localStorage
export default function PortalRoute({ children }) {
  const token = localStorage.getItem('forge_token');
  if (!token) return <Navigate to="/portal/login" replace />;
  return children;
}
