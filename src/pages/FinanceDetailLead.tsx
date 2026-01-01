import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { axiosClient } from '@/api/axiosClient';
import { formatDateTimePrague, parseApiDate } from '@/utils/dateTime';

type LeadDetail = {
  id: string;
  uniqueId?: number;
  status?: string;
  customer?: { name?: string } | Array<{ name?: string }>;
  lease?:
    | {
        start?: string | null;
        rentDuration?: number | null;
        monthlyPayment?: number | null;
        yearlyInsuranceFee?: number | null;
      }
    | Array<{
        start?: string | null;
        rentDuration?: number | null;
        monthlyPayment?: number | null;
        yearlyInsuranceFee?: number | null;
      }>;
};

const getFirst = <T,>(data: T | T[] | undefined): T | undefined => {
  if (!data) return undefined;
  return Array.isArray(data) ? data[0] : data;
};

const addMonths = (date: Date, months: number): Date => {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) {
    d.setDate(0);
  }
  return d;
};

export default function FinanceDetailLead() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lead, setLead] = useState<LeadDetail | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await axiosClient.get(`/leads/${id}`);
        setLead(res.data);
      } catch (e) {
        console.error('Failed to load lead finance:', e);
        setError('Nepodařilo se načíst finance');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const lease = useMemo(() => getFirst(lead?.lease as any), [lead]);
  const customer = useMemo(() => getFirst(lead?.customer as any), [lead]);

  const contractStart = useMemo(() => {
    const raw = lease?.start;
    if (!raw) return null;
    const d = parseApiDate(String(raw));
    return Number.isNaN(d.getTime()) ? null : d;
  }, [lease?.start]);

  const rentDurationMonths = typeof lease?.rentDuration === 'number' ? lease.rentDuration : null;

  const contractEnd = useMemo(() => {
    if (!contractStart || !rentDurationMonths || rentDurationMonths <= 0) return null;
    return addMonths(contractStart, rentDurationMonths);
  }, [contractStart, rentDurationMonths]);

  if (loading) {
    return <div className="p-6 text-gray-700">Načítám…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
        >
          Zpět
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow">
        <div className="text-sm text-gray-600">
          <div>
            Lead: <span className="font-medium">#{lead?.uniqueId ?? '-'}</span>
          </div>
          <div>
            Klient: <span className="font-medium">{customer?.name ?? '-'}</span>
          </div>
          <div>
            Status: <span className="font-medium">{lead?.status ?? '-'}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4 shadow">
        <div className="text-base font-semibold text-gray-900 mb-2">Smlouva</div>
        <div className="text-sm text-gray-700 space-y-1">
          <div>
            Začátek: <span className="font-medium">{contractStart ? formatDateTimePrague(contractStart) : '-'}</span>
          </div>
          <div>
            Konec: <span className="font-medium">{contractEnd ? formatDateTimePrague(contractEnd) : '-'}</span>
          </div>
          <div>
            Délka (měsíce): <span className="font-medium">{rentDurationMonths ?? '-'}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4 shadow">
        <div className="text-base font-semibold text-gray-900 mb-2">Platby a reconciliation</div>
        <div className="text-sm text-gray-600">Připisování příchozích plateb a reconciliation bude doplněno.</div>
      </div>

      <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4 shadow">
        <div className="text-base font-semibold text-gray-900 mb-2">Přijaté platby</div>
        <div className="text-sm text-gray-600">Zatím bez dat (bude doplněno).</div>
      </div>

      <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4 shadow">
        <div className="text-base font-semibold text-gray-900 mb-2">Vydané faktury</div>
        <div className="text-sm text-gray-600">Zatím bez dat (bude doplněno).</div>
      </div>
    </div>
  );
}
