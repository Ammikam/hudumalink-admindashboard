// src/components/ProtectedAdminRoute.tsx
// AdminLayout handles the actual admin role check internally.
// This component just ensures Clerk is loaded before rendering.
import { useAuth } from '@clerk/clerk-react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedAdminRoute() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;

  return <Outlet />;
}