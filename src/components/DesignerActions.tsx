import { useAuth } from '@clerk/clerk-react';
import { adminApi } from '@/api/Admin';

interface DesignerActionsProps {
  id: string;
  onActionComplete: () => void;
}

export default function DesignerActions({ id, onActionComplete }: DesignerActionsProps) {
  const { getToken } = useAuth();

  const approve = async () => {
    const token = await getToken();
    if (!token) {
      alert('Authentication required');
      return;
    }
    await adminApi.approveDesigner(id, token);
    onActionComplete();
  };

  const reject = async () => {
    const reason = prompt('Reason for rejection?');
    if (!reason) return;
    const token = await getToken();
    if (!token) {
      alert('Authentication required');
      return;
    }
    await adminApi.rejectDesigner(id, reason, token);
    onActionComplete();
  };

  return (
    <div className="flex gap-2">
      <button onClick={approve} className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
        Approve
      </button>
      <button onClick={reject} className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">
        Reject
      </button>
    </div>
  );
}
