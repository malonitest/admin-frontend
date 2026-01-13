import { useEffect, useState } from 'react';
import axiosClient from '@/api/axiosClient';
import { meApi, Invoice, Paginated } from '@/api/meApi';

const formatMoney = (value?: number, currency?: string) => {
  if (typeof value !== 'number') return '-';
  return `${value.toLocaleString('cs-CZ')} ${currency || ''}`.trim();
};

const downloadInvoice = async (externalToken: string) => {
  const response = await axiosClient.get(`/invoices/download/${encodeURIComponent(externalToken)}`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${externalToken}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
};

export function CustomerInvoices() {
  const [data, setData] = useState<Paginated<Invoice> | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const invoices = await meApi.getMyInvoices({ page: 1, limit: 20 });
        setData(invoices);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Nepodařilo se načíst faktury');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) return <div className="text-gray-600">Načítám…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const invoices = data?.results || [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Faktury</h1>

      {!invoices.length ? (
        <div className="text-gray-600">Zatím nemáte žádné faktury.</div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-3">Název</th>
                <th className="text-left p-3">Částka</th>
                <th className="text-left p-3">Stav</th>
                <th className="text-left p-3">Akce</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const paid = Boolean(inv.paymentDate);
                return (
                  <tr key={inv.id} className="border-t">
                    <td className="p-3 text-gray-900">{inv.title || inv.id}</td>
                    <td className="p-3 text-gray-700">{formatMoney(inv.value, inv.currency)}</td>
                    <td className="p-3">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {paid ? 'Zaplaceno' : 'Nezaplaceno'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 flex-wrap">
                        {inv.externalToken ? (
                          <button
                            onClick={() => downloadInvoice(inv.externalToken!)}
                            className="px-3 py-2 rounded-md text-xs font-medium bg-gray-900 text-white hover:bg-gray-800"
                          >
                            Stáhnout PDF
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">PDF zatím není</span>
                        )}

                        <button
                          disabled
                          className="px-3 py-2 rounded-md text-xs font-medium bg-blue-200 text-blue-700 cursor-not-allowed"
                          title="ThePay integrace bude doplněna později"
                        >
                          Zaplatit (brzy)
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs text-gray-500">
        Platby přes ThePay budou doplněny později.
      </div>
    </div>
  );
}

export default CustomerInvoices;
