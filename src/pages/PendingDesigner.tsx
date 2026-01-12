import { useEffect, useState } from 'react';
import { adminApi } from '@/api/Admin';
import { Designer } from '@/types/designer';
import PendingDesignersTable from '@/components/PendingDesignersTable';

export default function PendingDesigners() {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDesigners = async () => {
    setLoading(true);
    const data = await adminApi.getPendingDesigners();
    setDesigners(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDesigners();
  }, []);

  if (loading) return <p>Loading pending designers...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pending Designers</h1>
      <PendingDesignersTable
        designers={designers}
        onActionComplete={fetchDesigners}
      />
    </div>
  );
}
