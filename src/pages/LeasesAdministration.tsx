import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '@/components';
import { axiosClient } from '@/api/axiosClient';
import { tryFormatDateTimePrague } from '@/utils/dateTime';

type TriState = '' | 'true' | 'false';

type PeriodFilterType =
  | ''
  | 'TODAY'
  | 'YESTERDAY'
  | 'THIS_WEEK'
  | 'LAST_WEEK'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_YEAR'
  | 'LAST_YEAR';

interface LeadAdminRow {
  id: string;
  uniqueId?: number;
  status?: string;
  paidOutAt?: string | null;
  customer?:
    | {
        name?: string;
        phone?: string;
      }
    | Array<{
        name?: string;
        phone?: string;
      }>;
  tpSentToClientOk?: boolean;
  ksOrgReceivedOk?: boolean;
  nsOrgReceivedOk?: boolean;
  insuranceReceivedOk?: boolean;
  tpReceivedOk?: boolean;
  contractsEmailSentOk?: boolean;
}

interface LeadsResponse {
  results: LeadAdminRow[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

const getFirst = <T,>(data: T | T[] | undefined): T | undefined => {
  if (!data) return undefined;
  if (Array.isArray(data)) return data[0];
  return data;
};

const cleanString = (str: string | undefined): string => {
  if (!str) return '-';
  const lines = str.split(/[\n\r]+/).filter((line) => line.trim());
  return lines[0]?.trim() || '-';
};

const formatPhone = (raw: string | undefined): string => {
  if (!raw) return '-';
  const phone = raw.replace(/^\+420\s*/, '').trim();
  return phone || '-';
};

const boolFromTri = (v: TriState): boolean | undefined => {
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
};

const PERIOD_FILTERS: Array<{ value: PeriodFilterType; label: string }> = [
  { value: '', label: 'Vše' },
  { value: 'TODAY', label: 'Dnes' },
  { value: 'YESTERDAY', label: 'Včera' },
  { value: 'THIS_WEEK', label: 'Tento týden' },
  { value: 'LAST_WEEK', label: 'Minulý týden' },
  { value: 'THIS_MONTH', label: 'Tento měsíc' },
  { value: 'LAST_MONTH', label: 'Minulý měsíc' },
  { value: 'THIS_YEAR', label: 'Tento rok' },
  { value: 'LAST_YEAR', label: 'Minulý rok' },
];

const BoolCell = ({ value }: { value?: boolean }) => {
  return (
    <input
      type="checkbox"
      checked={Boolean(value)}
      readOnly
      className="h-4 w-4 rounded border-gray-300"
      aria-label={Boolean(value) ? 'Ano' : 'Ne'}
    />
  );
};

const normalizeLeadState = (state: string): string => {
  const stateMap: Record<string, string> = {
    CONCEPT: 'New',
    NEW: 'Nový lead',
    SUPERVISOR_APPROVED: 'Schválen AM',
    CUSTOMER_APPROVED: 'Schválen zákazníkem',
    ASSIGNED: 'Přiřazen OZ',
    CONVERTED: 'Konvertován',
    DECLINED: 'Zamítnut',
    AWAITS_APPROVAL: 'Čeká na schválení',
    SENT_TO_OZ: 'Odesláno OZ',
    SALES_APPROVED: 'Schváleno OZ',
    UPLOAD_DOCUMENTS: 'Předáno technikovi',
    FINAL_APPROVAL: 'Předáno k vyplacení',
    RETURNED_TO_SALES: 'Vráceno OZ',
    CLOSED: 'Uzavřeno',
  };
  return stateMap[state] || state;
};

export default function LeasesAdministration() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [rows, setRows] = useState<LeadAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(() => parseInt(searchParams.get('page') || '1'));
  const [limit, setLimit] = useState(() => parseInt(searchParams.get('limit') || '10'));
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');

  const [periodFilterType, setPeriodFilterType] = useState<PeriodFilterType>(() => (searchParams.get('periodFilterType') as PeriodFilterType) || '');

  const [tpSentToClientOk, setTpSentToClientOk] = useState<TriState>(() => (searchParams.get('tpSentToClientOk') as TriState) || '');
  const [ksOrgReceivedOk, setKsOrgReceivedOk] = useState<TriState>(() => (searchParams.get('ksOrgReceivedOk') as TriState) || '');
  const [nsOrgReceivedOk, setNsOrgReceivedOk] = useState<TriState>(() => (searchParams.get('nsOrgReceivedOk') as TriState) || '');
  const [insuranceReceivedOk, setInsuranceReceivedOk] = useState<TriState>(() => (searchParams.get('insuranceReceivedOk') as TriState) || '');
  const [tpReceivedOk, setTpReceivedOk] = useState<TriState>(() => (searchParams.get('tpReceivedOk') as TriState) || '');
  const [contractsEmailSentOk, setContractsEmailSentOk] = useState<TriState>(() => (searchParams.get('contractsEmailSentOk') as TriState) || '');

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (limit !== 10) params.set('limit', limit.toString());
    if (searchQuery.trim()) params.set('search', searchQuery.trim());

    if (periodFilterType) params.set('periodFilterType', periodFilterType);

    if (tpSentToClientOk) params.set('tpSentToClientOk', tpSentToClientOk);
    if (ksOrgReceivedOk) params.set('ksOrgReceivedOk', ksOrgReceivedOk);
    if (nsOrgReceivedOk) params.set('nsOrgReceivedOk', nsOrgReceivedOk);
    if (insuranceReceivedOk) params.set('insuranceReceivedOk', insuranceReceivedOk);
    if (tpReceivedOk) params.set('tpReceivedOk', tpReceivedOk);
    if (contractsEmailSentOk) params.set('contractsEmailSentOk', contractsEmailSentOk);

    return params;
  }, [page, limit, searchQuery, periodFilterType, tpSentToClientOk, ksOrgReceivedOk, nsOrgReceivedOk, insuranceReceivedOk, tpReceivedOk, contractsEmailSentOk]);

  useEffect(() => {
    setSearchParams(queryParams, { replace: true });
  }, [queryParams, setSearchParams]);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, any> = {
        page,
        limit,
        sortBy: 'createdAt:desc',
        leadStates: 'CONVERTED,CLOSED',
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (periodFilterType) params.periodFilterType = periodFilterType;

      const tp = boolFromTri(tpSentToClientOk);
      const ks = boolFromTri(ksOrgReceivedOk);
      const ns = boolFromTri(nsOrgReceivedOk);
      const ins = boolFromTri(insuranceReceivedOk);
      const tpr = boolFromTri(tpReceivedOk);
      const ce = boolFromTri(contractsEmailSentOk);

      if (tp !== undefined) params.tpSentToClientOk = tp;
      if (ks !== undefined) params.ksOrgReceivedOk = ks;
      if (ns !== undefined) params.nsOrgReceivedOk = ns;
      if (ins !== undefined) params.insuranceReceivedOk = ins;
      if (tpr !== undefined) params.tpReceivedOk = tpr;
      if (ce !== undefined) params.contractsEmailSentOk = ce;

      const response = await axiosClient.get<LeadsResponse>('/leads', { params });
      setRows(response.data.results || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (e) {
      console.error('Failed to fetch administration leads:', e);
      setError('Nepodařilo se načíst leady');
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, periodFilterType, tpSentToClientOk, ksOrgReceivedOk, nsOrgReceivedOk, insuranceReceivedOk, tpReceivedOk, contractsEmailSentOk]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, periodFilterType, tpSentToClientOk, ksOrgReceivedOk, nsOrgReceivedOk, insuranceReceivedOk, tpReceivedOk, contractsEmailSentOk]);

  const renderTriSelect = (label: string, value: TriState, onChange: (v: TriState) => void) => {
    return (
      <label className="flex flex-col gap-1 text-sm text-gray-700">
        <span className="font-medium">{label}</span>
        <select
          value={value}
          onChange={(e) => onChange((e.target.value as TriState) || '')}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
        >
          <option value="">Vše</option>
          <option value="true">Ano</option>
          <option value="false">Ne</option>
        </select>
      </label>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Pronájmy – Administrace</h1>
      </div>

      <Card>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <label className="flex flex-col gap-1 text-sm text-gray-700 md:max-w-sm">
              <span className="font-medium">Hledat</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="UniqueID / jméno / telefon"
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-700">
              <span className="font-medium">Limit</span>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value || '10'))}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              <span className="font-medium">Časový filtr</span>
              <select
                value={periodFilterType}
                onChange={(e) => setPeriodFilterType((e.target.value as PeriodFilterType) || '')}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
              >
                {PERIOD_FILTERS.map((p) => (
                  <option key={p.value || 'ALL'} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            {renderTriSelect('TP byl odeslán klientovi', tpSentToClientOk, setTpSentToClientOk)}
            {renderTriSelect('Přijata KS org', ksOrgReceivedOk, setKsOrgReceivedOk)}
            {renderTriSelect('Přijata NS org', nsOrgReceivedOk, setNsOrgReceivedOk)}
            {renderTriSelect('Přijata pojistka', insuranceReceivedOk, setInsuranceReceivedOk)}
            {renderTriSelect('Přijat TP', tpReceivedOk, setTpReceivedOk)}
            {renderTriSelect('Odeslán email se smlouvami kl.', contractsEmailSentOk, setContractsEmailSentOk)}
          </div>
        </div>
      </Card>

      <div className="mt-4">
        <Card>
          {loading ? (
            <div className="p-4 text-gray-700">Načítám...</div>
          ) : error ? (
            <div className="p-4 text-red-700">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left">UniqueID</th>
                    <th className="px-3 py-2 text-left">Zákazník</th>
                    <th className="px-3 py-2 text-left">Telefon</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Datum vyplacení</th>
                    <th className="px-3 py-2 text-center">TP byl odeslán klientovi</th>
                    <th className="px-3 py-2 text-center">Přijata KS org</th>
                    <th className="px-3 py-2 text-center">Přijata NS org</th>
                    <th className="px-3 py-2 text-center">Přijata pojistka</th>
                    <th className="px-3 py-2 text-center">Přijat TP</th>
                    <th className="px-3 py-2 text-center">Odeslán email se smlouvami kl.</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((lead) => {
                    const customer = getFirst(lead.customer);
                    const uniqueId = lead.uniqueId ?? '-';
                    const statusRaw = lead.status || '-';
                    const status = statusRaw !== '-' ? normalizeLeadState(statusRaw) : '-';
                    const paidOut = lead.paidOutAt ? (tryFormatDateTimePrague(lead.paidOutAt) ?? '-') : '-';

                    return (
                      <tr key={lead.id} className="border-t border-gray-200">
                        <td className="px-3 py-2">
                          <Link
                            to={`/leads/${lead.id}/v2`}
                            className="text-blue-700 hover:underline"
                          >
                            {uniqueId}
                          </Link>
                        </td>
                        <td className="px-3 py-2">{cleanString(customer?.name)}</td>
                        <td className="px-3 py-2">{formatPhone(customer?.phone)}</td>
                        <td className="px-3 py-2">{status}</td>
                        <td className="px-3 py-2">{paidOut || '-'}</td>
                        <td className="px-3 py-2 text-center">
                          <BoolCell value={lead.tpSentToClientOk} />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <BoolCell value={lead.ksOrgReceivedOk} />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <BoolCell value={lead.nsOrgReceivedOk} />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <BoolCell value={lead.insuranceReceivedOk} />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <BoolCell value={lead.tpReceivedOk} />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <BoolCell value={lead.contractsEmailSentOk} />
                        </td>
                      </tr>
                    );
                  })}

                  {rows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-600" colSpan={11}>
                        Žádné záznamy
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error ? (
            <div className="flex items-center justify-between p-3 border-t border-gray-200 text-sm text-gray-700">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              >
                Předchozí
              </button>
              <div>
                Strana {page} / {totalPages}
              </div>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              >
                Další
              </button>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
