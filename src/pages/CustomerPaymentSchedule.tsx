import { useEffect, useMemo, useState } from 'react';
import { meApi, PortalLead } from '@/api/meApi';
import { formatDateTimePrague } from '@/utils/dateTime';

const formatMoney = (value?: number) => {
  if (typeof value !== 'number') return '-';
  return `${value.toLocaleString('cs-CZ')} CZK`;
};

export function CustomerPaymentSchedule() {
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
        setError(e.response?.data?.message || 'Nepodařilo se načíst data');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const schedule = useMemo(() => {
    const duration = lead?.lease?.rentDuration;
    const monthly = lead?.lease?.monthlyPayment;
    const startRaw = (lead?.lease as any)?.start as string | undefined;
    const start = startRaw ? new Date(startRaw) : null;

    if (!duration || typeof duration !== 'number' || !monthly || typeof monthly !== 'number' || !start || Number.isNaN(start.getTime())) {
      return null;
    }

    const rows = Array.from({ length: duration }, (_, i) => {
      const due = new Date(start);
      due.setMonth(due.getMonth() + i);
      return { index: i + 1, due, amount: monthly };
    });

    return rows;
  }, [lead]);

  if (loading) return <div className="text-gray-600">Načítám…</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!lead) return <div className="text-gray-600">Lead nebyl nalezen.</div>;

  const lease: any = lead.lease ?? {};

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Splátkový kalendář</h1>

      <div className="bg-white border rounded-lg p-4 space-y-2">
        <div className="text-sm text-gray-700">Vytvořeno: {formatDateTimePrague(lead.createdAt)}</div>
        <div className="text-sm text-gray-700">Částka: {formatMoney(lead.lease?.leaseAmount)}</div>
        <div className="text-sm text-gray-700">Měsíční splátka: {formatMoney(lead.lease?.monthlyPayment)}</div>
        <div className="text-sm text-gray-700">Doba: {lead.lease?.rentDuration ?? '-'} měsíců</div>
        <div className="text-sm text-gray-700">Začátek: {lease.start ? formatDateTimePrague(lease.start) : '-'}</div>
        <div className="text-sm text-gray-700">Další splátka: {lease.nextPayment ? formatDateTimePrague(lease.nextPayment) : '-'}</div>
      </div>

      {schedule ? (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Splatnost</th>
                <th className="text-left p-3">Částka</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row) => (
                <tr key={row.index} className="border-t">
                  <td className="p-3 text-gray-900">{row.index}</td>
                  <td className="p-3 text-gray-700">{formatDateTimePrague(row.due)}</td>
                  <td className="p-3 text-gray-700">{formatMoney(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          Splátkový kalendář se zobrazí automaticky, jakmile bude vyplněn začátek smlouvy a parametry splátek.
        </div>
      )}
    </div>
  );
}

export default CustomerPaymentSchedule;
