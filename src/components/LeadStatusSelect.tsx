import * as React from 'react';
import { updateLeadStatus } from '@/utils/supabaseAdmin';
import { toast } from 'sonner';
import { Select } from '@/components/ui/select';

type Props = {
  leadId: string;
  currentStatus: string;
};

const statusOptions = ['new', 'contacted', 'quoted', 'won', 'lost'];

export default function LeadStatusSelect({ leadId, currentStatus }: Props) {
  const [status, setStatus] = React.useState(currentStatus);
  const [updating, setUpdating] = React.useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setUpdating(true);
    try {
      await updateLeadStatus(leadId, value);
      setStatus(value);
      toast.success('Lead status updated');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update lead status');
    }
    setUpdating(false);
  };

  return (
    <Select
      value={status}
      onChange={handleChange}
      disabled={updating}
      className="w-28 text-xs p-1 h-8"
    >
      {statusOptions.map((opt) => (
        <option key={opt} value={opt}>
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </option>
      ))}
    </Select>
  );
}
