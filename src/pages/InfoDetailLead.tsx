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

type Invoice = {
  id: string;
  title?: string | null;
  value?: number | null;
  paymentDate?: string | null;
  externalToken?: string | null;
  lease?: string | null;
};

const getFirst = <T,>(data: T | T[] | undefined): T | undefined => {
  if (!data) return undefined;
  return Array.isArray(data) ? data[0] : data;
};

const addMonths = (date: Date, months: number): Date => {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  // Handle month overflow (e.g. Jan 31 + 1 month)
  if (d.getDate() < day) {
    d.setDate(0);
  }
  return d;
};

const formatMoneyCz = (value: number | null | undefined): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return `${new Intl.NumberFormat('cs-CZ').format(value)} Kč`;
};

const formatSignedMoneyCz = (value: number): string => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${new Intl.NumberFormat('cs-CZ').format(value)} Kč`;
};


export default function InfoDetailLead() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lead, setLead] = useState<LeadDetail | null>(null);

  const [paidInvoices, setPaidInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);
  const [invoiceActionBusyId, setInvoiceActionBusyId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await axiosClient.get(`/leads/${id}`);
        setLead(res.data);
      } catch (e) {
        console.error('Failed to load lead info:', e);
        setError('Nepodařilo se načíst informace');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const lease = useMemo(() => getFirst(lead?.lease as any), [lead]);
  const customer = useMemo(() => getFirst(lead?.customer as any), [lead]);

  useEffect(() => {
    const run = async () => {
      setInvoicesLoading(true);
      setInvoicesError(null);
      try {
        if (!id) {
          setPaidInvoices([]);
          return;
        }

        const res = await axiosClient.get<Invoice[]>(`/invoices/lead/${encodeURIComponent(id)}/paid`);
        const paid = Array.isArray(res.data) ? res.data : [];

        paid.sort((a, b) => {
          const da = a.paymentDate ? parseApiDate(String(a.paymentDate)).getTime() : 0;
          const db = b.paymentDate ? parseApiDate(String(b.paymentDate)).getTime() : 0;
          return da - db;
        });

        setPaidInvoices(paid);
      } catch (e) {
        console.error('Failed to load invoices:', e);
        setInvoicesError('Nepodařilo se načíst faktury');
        setPaidInvoices([]);
      } finally {
        setInvoicesLoading(false);
      }
    };
    run();
  }, [id]);

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

  const expectedPayments = useMemo(() => {
    if (!contractStart || !rentDurationMonths || rentDurationMonths <= 0) return [] as Array<{ i: number; due: Date; amount: number | null }>;

    const monthlyPayment = typeof lease?.monthlyPayment === 'number' ? lease.monthlyPayment : null;
    const yearlyInsuranceFee = typeof lease?.yearlyInsuranceFee === 'number' ? lease.yearlyInsuranceFee : 0;

    const totalInsuranceForDuration = yearlyInsuranceFee > 0 ? Math.round((rentDurationMonths / 12) * yearlyInsuranceFee) : 0;
    const insurancePerMonth = totalInsuranceForDuration > 0 ? Math.round(totalInsuranceForDuration / rentDurationMonths) : 0;

    const amount = monthlyPayment != null ? monthlyPayment + insurancePerMonth : null;

    return Array.from({ length: rentDurationMonths }, (_, idx) => {
      const due = addMonths(contractStart, idx);
      return { i: idx + 1, due, amount };
    });
  }, [contractStart, rentDurationMonths, lease?.monthlyPayment, lease?.yearlyInsuranceFee]);

  const receivedPayments = useMemo(() => {
    return paidInvoices
      .filter((inv: Invoice) => inv.paymentDate)
      .map((inv: Invoice, idx: number) => {
        const date = parseApiDate(String(inv.paymentDate));
        return {
          i: idx + 1,
          date: Number.isNaN(date.getTime()) ? null : date,
          amount: typeof inv.value === 'number' ? inv.value : null,
          invoice: inv,
        };
      });
  }, [paidInvoices]);

  const combinedRows = useMemo(() => {
    const length = Math.max(expectedPayments.length, receivedPayments.length);
    return Array.from({ length }, (_, idx) => {
      const expected = expectedPayments[idx];
      const received = receivedPayments[idx];
      const diff =
        expected && typeof expected.amount === 'number' && received && typeof received.amount === 'number'
          ? expected.amount - received.amount
          : null;
      return {
        i: idx + 1,
        expected,
        received,
        diff,
      };
    });
  }, [expectedPayments, receivedPayments]);

  const downloadInvoiceBlob = async (externalToken: string) => {
    const res = await axiosClient.get(`/invoices/download/${encodeURIComponent(externalToken)}`, {
      responseType: 'blob',
    });
    return res.data as Blob;
  };

  const openInvoice = async (invoice: Invoice) => {
    if (!invoice.externalToken) return;
    setInvoiceActionBusyId(invoice.id);
    try {
      const blob = await downloadInvoiceBlob(invoice.externalToken);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } finally {
      setInvoiceActionBusyId(null);
    }
  };

  const downloadInvoice = async (invoice: Invoice) => {
    if (!invoice.externalToken) return;
    setInvoiceActionBusyId(invoice.id);
    try {
      const blob = await downloadInvoiceBlob(invoice.externalToken);
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = invoice.externalToken;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } finally {
      setInvoiceActionBusyId(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-700">Načítám…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Informace</h1>
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
        <div className="text-base font-semibold text-gray-900 mb-2">Splátkový kalendář</div>

        {expectedPayments.length === 0 && receivedPayments.length === 0 ? (
          <div className="text-sm text-gray-600">Zatím není k dispozici (chybí smlouva / platby).</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Očekávané datum</th>
                  <th className="py-2 pr-4">Očekávaná částka</th>
                  <th className="py-2 pr-4">Přijaté datum</th>
                  <th className="py-2 pr-4">Přijatá částka</th>
                  <th className="py-2 pr-4">Rozdíl (oček. - přijatá)</th>
                </tr>
              </thead>
              <tbody>
                {combinedRows.map((row) => (
                  <tr key={row.i} className="border-b last:border-b-0">
                    <td className="py-2 pr-4">{row.i}</td>
                    <td className="py-2 pr-4">{row.expected ? formatDateTimePrague(row.expected.due) : '-'}</td>
                    <td className="py-2 pr-4">{row.expected ? formatMoneyCz(row.expected.amount) : '-'}</td>
                    <td className="py-2 pr-4">{row.received?.date ? formatDateTimePrague(row.received.date) : '-'}</td>
                    <td className="py-2 pr-4">{row.received ? formatMoneyCz(row.received.amount) : '-'}</td>
                    <td className="py-2 pr-4">{typeof row.diff === 'number' ? formatSignedMoneyCz(row.diff) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4">
          <div className="text-base font-semibold text-gray-900 mb-2">Faktury za přijaté platby</div>
          {invoicesLoading ? (
            <div className="text-sm text-gray-700">Načítám faktury…</div>
          ) : invoicesError ? (
            <div className="text-sm text-red-600">{invoicesError}</div>
          ) : paidInvoices.length === 0 ? (
            <div className="text-sm text-gray-600">Zatím bez faktur k přijatým platbám.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2 pr-4">Datum</th>
                    <th className="py-2 pr-4">Název</th>
                    <th className="py-2 pr-4">Částka</th>
                    <th className="py-2 pr-4">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {paidInvoices.map((inv) => {
                    const date = inv.paymentDate ? parseApiDate(String(inv.paymentDate)) : null;
                    const canUse = !!inv.externalToken;
                    const busy = invoiceActionBusyId === inv.id;

                    return (
                      <tr key={inv.id} className="border-b last:border-b-0">
                        <td className="py-2 pr-4">{date && !Number.isNaN(date.getTime()) ? formatDateTimePrague(date) : '-'}</td>
                        <td className="py-2 pr-4">{inv.title ?? 'Faktura'}</td>
                        <td className="py-2 pr-4">{formatMoneyCz(typeof inv.value === 'number' ? inv.value : null)}</td>
                        <td className="py-2 pr-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => openInvoice(inv)}
                              disabled={!canUse || busy}
                              className="px-3 py-1 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                            >
                              Otevřít
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadInvoice(inv)}
                              disabled={!canUse || busy}
                              className="px-3 py-1 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                            >
                              Stáhnout
                            </button>
                          </div>
                          {!canUse ? <div className="text-xs text-gray-500 mt-1">Soubor faktury není k dispozici.</div> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
