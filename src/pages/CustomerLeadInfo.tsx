import { useEffect, useState } from 'react';
import { meApi, PortalLead } from '@/api/meApi';

export function CustomerLeadInfo() {
  const [lead, setLead] = useState<PortalLead | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const data = await meApi.getMyLead();
        setLead(data);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Nepodařilo se načíst lead');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) return <div className="text-gray-600">Načítám…</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!lead) return <div className="text-gray-600">Lead nebyl nalezen.</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Lead informace</h1>

      <div className="bg-white border rounded-lg p-4 space-y-2">
        <div className="text-sm text-gray-700">Vytvořeno: {lead.createdAt || '-'}</div>
        <div className="text-sm text-gray-700">Měsíční splátka: {lead.lease?.monthlyPayment ?? '-'} {lead.lease?.monthlyPayment ? 'CZK' : ''}</div>
        <div className="text-sm text-gray-700">Doba: {lead.lease?.rentDuration ?? '-'} měsíců</div>
        <div className="text-sm text-gray-700">Částka: {lead.lease?.leaseAmount ?? '-'} {lead.lease?.leaseAmount ? 'CZK' : ''}</div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <div className="text-sm font-semibold text-gray-900 mb-2">Adresa</div>
        <div className="text-sm text-gray-700">{lead.customer?.address || '-'}</div>
        <div className="text-sm text-gray-700">
          {(lead.customer?.postalCode || '').toString()} {(lead.customer?.city || '').toString()}
        </div>
      </div>
    </div>
  );
}

export default CustomerLeadInfo;
