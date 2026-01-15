import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react';

import AdminLayout from './pages/AdminLayout';
import Dashboard from './pages/AdminDashboard';
import PendingDesigners from './pages/PendingDesigner';

function ProtectedAdminRoute() {
  return (
    <SignedIn>
      <AdminLayout />
    </SignedIn>
  );
}

function PublicSignIn() {
  return (
    <SignedOut>
      <SignIn routing="path" path="/sign-in" />
    </SignedOut>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Sign In Page */}
        <Route path="/sign-in/*" element={<PublicSignIn />} />

        {/* All Admin Routes */}
        <Route path="/admin/*" element={<ProtectedAdminRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="pending-designers" element={<PendingDesigners />} />
          {/* Add more here */}
        </Route>

        {/* Root: Signed in → Dashboard, Signed out → Sign In */}
        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <Navigate to="/admin" replace />
              </SignedIn>
              <SignedOut>
                <Navigate to="/sign-in" replace />
              </SignedOut>
            </>
          }
        />

        {/* Catch-all */}
        <Route
          path="*"
          element={
            <>
              <SignedIn>
                <Navigate to="/admin" replace />
              </SignedIn>
              <SignedOut>
                <Navigate to="/sign-in" replace />
              </SignedOut>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}