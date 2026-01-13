import { useEffect, useState } from 'react';
import { meApi, PortalLead } from '@/api/meApi';

export function CustomerLeadDetail() {
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

  if (loading) {
    return <div className="text-gray-600">Načítám…</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!lead) {
    return <div className="text-gray-600">Lead nebyl nalezen.</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Detail leadu</h1>

      <div className="bg-white border rounded-lg p-4">
        <div className="text-sm text-gray-500">Stav</div>
        <div className="text-lg font-semibold">{lead.status || '-'}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm font-semibold text-gray-900 mb-2">Zákazník</div>
          <div className="text-sm text-gray-700">Jméno: {lead.customer?.name || '-'}</div>
          <div className="text-sm text-gray-700">Telefon: {lead.customer?.phone || '-'}</div>
          <div className="text-sm text-gray-700">Email: {lead.customer?.email || '-'}</div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm font-semibold text-gray-900 mb-2">Vozidlo</div>
          <div className="text-sm text-gray-700">Značka: {lead.car?.brand || '-'}</div>
          <div className="text-sm text-gray-700">Model: {lead.car?.model || '-'}</div>
          <div className="text-sm text-gray-700">VIN: {lead.car?.VIN || '-'}</div>
          <div className="text-sm text-gray-700">Nájezd: {lead.car?.mileage ?? '-'} km</div>
        </div>
      </div>
    </div>
  );
}

export default CustomerLeadDetail;
