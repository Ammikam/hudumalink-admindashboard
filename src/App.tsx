import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react';

import AdminLayout from './pages/AdminLayout';
import Dashboard from './pages/AdminDashboard';
import PendingDesigners from './pages/PendingDesigner';
import AllDesigners  from './pages/AllDesigners';
import UsersPage from './pages/UserPage';
import ProjectsPage from './pages/ProjectPage';

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
        <Route path="/sign-in/*" element={<PublicSignIn />} />
        <Route path="/admin/*" element={<ProtectedAdminRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="pending-designers" element={<PendingDesigners />} />
          <Route path="designers" element={<AllDesigners />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="projects" element={<ProjectsPage />} />
        </Route>
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