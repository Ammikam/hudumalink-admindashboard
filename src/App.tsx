import { SignedIn, SignedOut, SignIn, useAuth } from '@clerk/clerk-react';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <>
      <SignedOut>
        <SignIn />
      </SignedOut>

      <SignedIn>
        <AdminDashboard />
      </SignedIn>
    </>
  );
}
