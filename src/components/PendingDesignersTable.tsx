import { Designer } from '@/types/designer';
import DesignerActions from '@/components/DesignerActions';

interface Props {
  designers: Designer[];
  onActionComplete: () => void;
}

export default function PendingDesignersTable({ designers, onActionComplete }: Props) {
  if (!designers.length) {
    return <p>No pending designers 🎉</p>;
  }

  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Location</th>
          <th>Styles</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {designers.map(d => (
          <tr key={d._id}>
            <td>{d.name}</td>
            <td>{d.email}</td>
            <td>{d.designerProfile.location}</td>
            <td>{d.designerProfile.styles.join(', ')}</td>
            <td>
              <DesignerActions
                id={d._id}
                onActionComplete={onActionComplete}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
