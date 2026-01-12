import { adminApi } from '@/api/Admin';

export default function DesignerActions({
  id,
  onActionComplete,
}: {
  id: string;
  onActionComplete: () => void;
}) {
  const approve = async () => {
    await adminApi.approveDesigner(id);
    onActionComplete();
  };

  const reject = async () => {
    const reason = prompt('Reason for rejection?');
    if (!reason) return;
    await adminApi.rejectDesigner(id, reason);
    onActionComplete();
  };

  return (
    <div className="flex gap-2">
      <button onClick={approve} className="bg-green-600 text-white px-2">
        Approve
      </button>
      <button onClick={reject} className="bg-red-600 text-white px-2">
        Reject
      </button>
    </div>
  );
}
