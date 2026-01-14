import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { adminApi } from '@/api/Admin';
import { Designer } from '@/types/designer';
import PendingDesignersTable from '@/components/PendingDesignersTable';

export default function PendingDesigners() {
  const { isLoaded, userId, getToken } = useAuth();

  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDesigners = async () => {
    if (!isLoaded || !userId) return;

    try {
      setLoading(true);
      // FIXED: Removed { template: 'standard' }
      const token = await getToken();
      if (!token) {
        console.error('Failed to get token');
        return;
      }

      const data = await adminApi.getPendingDesigners(token);
      setDesigners(data);
    } catch (err) {
      console.error('Error fetching designers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigners();
  }, [isLoaded, userId, getToken]);

  const handleActionComplete = () => {
    fetchDesigners(); // Refresh list after approve/reject
  };

  if (loading) return <p>Loading pending designers...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pending Designers</h1>
      <PendingDesignersTable
        designers={designers}
        onActionComplete={handleActionComplete}
      />
    </div>
  );
}