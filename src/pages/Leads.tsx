import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components';
import { axiosClient } from '@/api/axiosClient';
import { formatDateTimePrague, parseApiDate } from '@/utils/dateTime';

interface Lead {
  id: string;
  uniqueId?: number;
  createdAt: string;
  updatedAt?: string;
  statusUpdatedAt?: string;
  subStatus?: string | null;
  subStatusHistory?: Array<{
    subStatus?: string;
    changedAt?: string;
  }>;
  noteMessage?: string;
  note?: Array<{
    message?: string;
    text?: string;
    note?: string;
    createdAt?: string;
  }>;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  } | Array<{
    name?: string;
    phone?: string;
    email?: string;
  }>;
  car?: {
    brand?: string;
    model?: string;
  } | Array<{
    brand?: string;
    model?: string;
  }>;
  status: string;
  declinedType?: string;
  notInterestedStatus?: string;
  source?: string;
  affiliate?: string;
  dealer?: {
    id: string;
    name?: string;
    user?: {
      name?: string;
    };
  };
  originalAuthor?: {
    id: string;
    name?: string;
    user?: {
      name?: string;
    };
  };
  lastModifiedBy?: {
    id: string;
    name?: string;
    user?: {
      name?: string;
    };
  };
}

interface Dealer {
  id: string;
  user?: {
    name?: string;
  };
}

interface LeadsResponse {
  results: Lead[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

// Helper to get first item if array, or return object
const getFirst = <T,>(data: T | T[] | undefined): T | undefined => {
  if (!data) return undefined;
  if (Array.isArray(data)) return data[0];
  return data;
};

// Helper to clean multiline strings - take only first line
const cleanString = (str: string | undefined): string => {
  if (!str) return '-';
  const lines = str.split(/[\n\r]+/).filter(line => line.trim());
  return lines[0]?.trim() || '-';
};

const getLeadNoteMessage = (lead: Lead): string => {
  const latest = getLeadLatestNote(lead);
  if (latest?.message) return cleanString(latest.message);
  if (lead.noteMessage) return cleanString(lead.noteMessage);
  return '-';
};

const getLeadLatestNote = (lead: Lead): { message?: string; createdAt?: string } | undefined => {
  const notes = lead.note;
  if (!notes || notes.length === 0) return undefined;

  let latest: { message?: string; createdAt?: string } | undefined;
  let latestMs = -1;

  for (const n of notes) {
    const createdAt = n.createdAt;
    if (!createdAt) continue;
    const ms = parseApiDate(createdAt).getTime();
    if (Number.isNaN(ms)) continue;
    if (ms > latestMs) {
      latestMs = ms;
      latest = {
        createdAt,
        message: n.message || n.text || n.note,
      };
    }
  }

  // If we had notes but none with parsable createdAt, at least return message from first note.
  if (!latest) {
    const first = notes[0];
    return { createdAt: first?.createdAt, message: first?.message || first?.text || first?.note };
  }

  return latest;
};

const getLeadLatestNoteAt = (lead: Lead): string | undefined => {
  return getLeadLatestNote(lead)?.createdAt;
};

const getLeadLatestSubStatusChangeAt = (lead: Lead): string | undefined => {
  const history = lead.subStatusHistory;
  if (!history || history.length === 0) return undefined;

  let latest: string | undefined;
  let latestMs = -1;

  for (const h of history) {
    const changedAt = h.changedAt;
    if (!changedAt) continue;
    const ms = parseApiDate(changedAt).getTime();
    if (Number.isNaN(ms)) continue;
    if (ms > latestMs) {
      latestMs = ms;
      latest = changedAt;
    }
  }

  return latest;
};

const getSubStatusDeltaHHMM = (lead: Lead): string | undefined => {
  const history = lead.subStatusHistory;
  if (!history || history.length < 2) return undefined;

  const sorted = [...history]
    .filter((h) => Boolean(h.changedAt))
    .map((h) => ({ changedAt: h.changedAt as string, ms: parseApiDate(h.changedAt as string).getTime() }))
    .filter((h) => !Number.isNaN(h.ms))
    .sort((a, b) => b.ms - a.ms);

  if (sorted.length < 2) return undefined;

  const diffMinutes = (sorted[0].ms - sorted[1].ms) / (1000 * 60);
  return formatHHMM(diffMinutes);
};

const formatHHMM = (totalMinutes: number): string => {
  const minutes = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const getLeadLastContactMs = (lead: Lead): number | null => {
  const lastNoteAt = getLeadLatestNoteAt(lead);
  const lastSubStatusAt = getLeadLatestSubStatusChangeAt(lead);

  const lastNoteMs = lastNoteAt ? parseApiDate(lastNoteAt).getTime() : Number.NaN;
  const lastSubStatusMs = lastSubStatusAt ? parseApiDate(lastSubStatusAt).getTime() : Number.NaN;

  const lastMs = Math.max(
    Number.isNaN(lastNoteMs) ? -1 : lastNoteMs,
    Number.isNaN(lastSubStatusMs) ? -1 : lastSubStatusMs
  );

  return lastMs < 0 ? null : lastMs;
};

const getContactDeltaHHMM = (lead: Lead): string => {
  const lastMs = getLeadLastContactMs(lead);
  if (!lastMs) return '-';
  const nowMs = Date.now();
  const diffMinutes = (nowMs - lastMs) / (1000 * 60);
  return formatHHMM(diffMinutes);
};

const LEAD_STATES = [
  { value: '', label: 'Všechny' },
  { value: 'CONCEPT', label: 'New' },
  { value: 'NEW', label: 'Nový lead' },
  { value: 'SUPERVISOR_APPROVED', label: 'Schválen AM' },
  { value: 'CUSTOMER_APPROVED', label: 'Schválen zákazníkem' },
  { value: 'ASSIGNED', label: 'Přiřazen OZ' },
  { value: 'SENT_TO_OZ', label: 'Odesláno OZ' },
  { value: 'SALES_APPROVED', label: 'Schváleno OZ' },
  { value: 'UPLOAD_DOCUMENTS', label: 'Předáno technikovi' },
  { value: 'FINAL_APPROVAL', label: 'Předáno k vyplacení' },
  { value: 'CONVERTED', label: 'Konvertován' },
  { value: 'DECLINED', label: 'Zamítnut' },
  { value: 'RETURNED_TO_SALES', label: 'Vráceno OZ' },
];

const LEAD_SUBSTATES = [
  { value: '', label: 'Všechny' },
  { value: 'NOT_REACHED_1', label: 'Nedovoláno 1x' },
  { value: 'NOT_REACHED_2', label: 'Nedovoláno 2x' },
  { value: 'NOT_REACHED_3', label: 'Nedovoláno 3x' },
  { value: 'NOT_REACHED_4', label: 'Nedovoláno 4x' },
  { value: 'NOT_REACHED_X', label: 'Nedovoláno opakovaně' },
  { value: 'CAR_LOW_VALUE', label: 'Nízká hodnota auta' },
  { value: 'CAR_OLD', label: 'Stáří vozu' },
  { value: 'CAR_BAD_TECHNICAL_STATE', label: 'Zlý technický stav' },
  { value: 'CAR_HIGH_MILEAGE', label: 'Vysoký nájezd' },
  { value: 'CAR_DENIED_BY_TECHNICIAN', label: 'Zamítnuto technikem' },
  { value: 'CUSTOMER_NOT_INTERESTED_BUY', label: 'Nechce řešit' },
  { value: 'CUSTOMER_PRICE_DISADVANTAGEOUS', label: 'Nevýhodná cena' },
  { value: 'IN_PROGRESS', label: 'V řešení' },
  { value: 'AWAITING_FEEDBACK', label: 'Zpětný kontakt' },
  { value: 'ASSIGNED_TO_TECHNICIAN', label: 'Předáno technikovi' },
];

const PERIOD_FILTERS = [
  { value: '', label: 'Všechny' },
  { value: 'TODAY', label: 'Dnes' },
  { value: 'YESTERDAY', label: 'Včera' },
  { value: 'THIS_WEEK', label: 'Tento týden' },
  { value: 'LAST_WEEK', label: 'Minulý týden' },
  { value: 'THIS_MONTH', label: 'Tento měsíc' },
  { value: 'LAST_MONTH', label: 'Minulý měsíc' },
  { value: 'THIS_YEAR', label: 'Tento rok' },
  { value: 'LAST_YEAR', label: 'Minulý rok' },
];

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
  };
  return stateMap[state] || state;
};

const normalizeSubstatus = (type: string | undefined): string => {
  if (!type) return '-';
  const typeMap: Record<string, string> = {
    NOT_REACHED_1: 'Nedovoláno 1x',
    NOT_REACHED_2: 'Nedovoláno 2x',
    NOT_REACHED_3: 'Nedovoláno 3x',
    NOT_REACHED_4: 'Nedovoláno 4x',
    NOT_REACHED_X: 'Nedovoláno Xx',
    CAR_LOW_VALUE: 'Nízká hodnota',
    CAR_OLD: 'Stáří vozu',
    CAR_BAD_TECHNICAL_STATE: 'Zlý tech. stav',
    CAR_HIGH_MILEAGE: 'Vysoký nájezd',
    CAR_DENIED_BY_TECHNICIAN: 'Zamítnuto tec.',
    CUSTOMER_NOT_INTERESTED_BUY: 'Nechce řešit',
    CUSTOMER_PRICE_DISADVANTAGEOUS: 'Nevýhodná cena',
    IN_PROGRESS: 'V řešení',
    AWAITING_FEEDBACK: 'Zpětný kontakt',
    ASSIGNED_TO_TECHNICIAN: 'Předáno tech.',
  };
  return typeMap[type] || type;
};

const normalizeSource = (source: string | undefined): string => {
  if (!source) return '-';
  const sourceMap: Record<string, string> = {
    APP: 'Aplikace',
    WEB: 'Web',
    AFFILIATE: 'Affiliate',
    SALES: 'CC',
    OS: 'OS',
  };
  return sourceMap[source] || source;
};

const getSourceDisplay = (lead: Lead): string => {
  if (lead.affiliate) {
    const affiliateMap: Record<string, string> = {
      "web1": "Web - CASH",
      "web-cash": "Web - CASH",
      "autozastava": "Web - AUTOZÁSTAVA",
      "web-autozastava": "Web - AUTOZÁSTAVA",
      "cash": "Web - CASH",
    };
    return affiliateMap[lead.affiliate.toLowerCase()] || `Web - ${lead.affiliate.toUpperCase()}`;
  }
  return normalizeSource(lead.source);
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

type LeadsProps = {
  forcedLeadState?: string;
};

export function Leads({ forcedLeadState }: LeadsProps = {}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isAmApprovedPage = forcedLeadState === 'SUPERVISOR_APPROVED';
  const tableColSpan = isAmApprovedPage ? 10 : 13;
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(() => parseInt(searchParams.get('page') || '1'));
  const [limit, setLimit] = useState(() => parseInt(searchParams.get('limit') || '10'));
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterState, setFilterState] = useState(() => forcedLeadState ?? (searchParams.get('leadState') || ''));
  const [filterSubstate, setFilterSubstate] = useState(() => searchParams.get('leadSubState') || '');
  const [filterPeriod, setFilterPeriod] = useState(() => searchParams.get('periodFilterType') || '');
  const [filterDealer, setFilterDealer] = useState(() => searchParams.get('dealerId') || '');
  
  const [appliedFilters, setAppliedFilters] = useState({
    leadState: forcedLeadState ?? (searchParams.get('leadState') || ''),
    leadSubState: searchParams.get('leadSubState') || '',
    periodFilterType: searchParams.get('periodFilterType') || '',
    dealerId: searchParams.get('dealerId') || '',
  });

  const resetParam = searchParams.get('reset');

  const effectiveLeadState = forcedLeadState ?? appliedFilters.leadState;

  // When arriving from the menu "Všechny leady", always clear filters/search.
  useEffect(() => {
    if (forcedLeadState) return;
    if (resetParam !== '1') return;

    setSearchQuery('');
    setFilterState('');
    setFilterSubstate('');
    setFilterPeriod('');
    setFilterDealer('');
    setAppliedFilters({
      leadState: '',
      leadSubState: '',
      periodFilterType: '',
      dealerId: '',
    });
    setFilterOpen(false);
    setPage(1);

    // Remove reset (and any previous query params) after applying.
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [forcedLeadState, resetParam, setSearchParams]);

  const displayLeads = useMemo(() => {
    if (!isAmApprovedPage) return leads;

    const nowMs = Date.now();

    return leads
      .map((lead, index) => {
        const lastMs = getLeadLastContactMs(lead);
        const contactMinutes = lastMs ? Math.floor((nowMs - lastMs) / (1000 * 60)) : -1;
        return { lead, contactMinutes, index };
      })
      .sort((a, b) => {
        if (b.contactMinutes !== a.contactMinutes) return b.contactMinutes - a.contactMinutes;
        return a.index - b.index;
      })
      .map((x) => x.lead);
  }, [isAmApprovedPage, leads]);

  // Keep internal state consistent when a forced filter is used.
  useEffect(() => {
    if (!forcedLeadState) return;
    setFilterState(forcedLeadState);
    setAppliedFilters((prev) => (prev.leadState === forcedLeadState ? prev : { ...prev, leadState: forcedLeadState }));
  }, [forcedLeadState]);

  // Sync URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (limit !== 10) params.set('limit', limit.toString());
    if (searchQuery) params.set('search', searchQuery);
    if (effectiveLeadState) params.set('leadState', effectiveLeadState);
    if (appliedFilters.leadSubState) params.set('leadSubState', appliedFilters.leadSubState);
    if (appliedFilters.periodFilterType) params.set('periodFilterType', appliedFilters.periodFilterType);
    if (appliedFilters.dealerId) params.set('dealerId', appliedFilters.dealerId);
    setSearchParams(params, { replace: true });
  }, [page, limit, searchQuery, effectiveLeadState, appliedFilters.leadSubState, appliedFilters.periodFilterType, appliedFilters.dealerId, setSearchParams]);

  const debouncedSearch = useDebounce(searchQuery, 400);

  useEffect(() => {
    const fetchDealers = async () => {
      try {
        const response = await axiosClient.get('/dealers', { params: { limit: 100 } });
        setDealers(response.data.results || []);
      } catch (err) {
        console.error('Failed to fetch dealers:', err);
      }
    };
    fetchDealers();
  }, []);

  const fetchLeads = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params: Record<string, any> = { 
        page, 
        limit, 
        sortBy: 'createdAt:desc' 
      };
      
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      
      if (effectiveLeadState) params.leadState = effectiveLeadState;
      if (appliedFilters.leadSubState) params.leadSubState = appliedFilters.leadSubState;
      if (appliedFilters.periodFilterType) params.periodFilterType = appliedFilters.periodFilterType;
      if (appliedFilters.dealerId) params.dealerId = appliedFilters.dealerId;
      
      const response = await axiosClient.get<LeadsResponse>('/leads', { params });
      setLeads(response.data.results);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
      setError('Nepodařilo se načíst leady');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, effectiveLeadState, appliedFilters.leadSubState, appliedFilters.periodFilterType, appliedFilters.dealerId]);

  useEffect(() => {
    fetchLeads();
    
    // Auto-refresh every 60 seconds (silent to avoid spinner flicker)
    const refreshInterval = setInterval(() => {
      fetchLeads(true);
    }, 60000);
    
    return () => clearInterval(refreshInterval);
  }, [fetchLeads]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, appliedFilters]);

  const handleApplyFilter = () => {
    setAppliedFilters({
      leadState: forcedLeadState ?? filterState,
      leadSubState: filterSubstate,
      periodFilterType: filterPeriod,
      dealerId: filterDealer,
    });
    setFilterOpen(false);
  };

  const handleResetFilter = () => {
    setFilterState(forcedLeadState ?? '');
    setFilterSubstate('');
    setFilterPeriod('');
    setFilterDealer('');
    setAppliedFilters({
      leadState: forcedLeadState ?? '',
      leadSubState: '',
      periodFilterType: '',
      dealerId: '',
    });
    setFilterOpen(false);
  };

  const hasActiveFilters = effectiveLeadState || appliedFilters.leadSubState || appliedFilters.periodFilterType || appliedFilters.dealerId;

  const formatDateTime = (dateStr: string) => {
    return formatDateTimePrague(dateStr);
  };

  const getStatusStyle = (status: string) => {
    if (status === 'DECLINED') return 'bg-gray-200 text-gray-700';
    if (status === 'SUPERVISOR_APPROVED' || status === 'CONVERTED') return 'bg-green-100 text-green-800';
    if (status === 'NEW' || status === 'CONCEPT') return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const canOrder = (status: string) => {
    // Detail should be accessible for all leads except declined.
    return status !== 'DECLINED';
  };
  
  const isDeclined = (status: string): boolean => {
    return status === 'DECLINED';
  };

  const getDealerName = (lead: Lead): string => {
    // Use lastModifiedBy (last dealer who made changes), fallback to dealer
    if (lead.lastModifiedBy?.user?.name) return lead.lastModifiedBy.user.name;
    if (lead.lastModifiedBy?.name) return lead.lastModifiedBy.name;
    if (lead.dealer?.user?.name) return lead.dealer.user.name;
    if (lead.dealer?.name) return lead.dealer.name;
    return '-';
  };

  const getAuthorName = (lead: Lead): string => {
    if (lead.originalAuthor?.user?.name) return lead.originalAuthor.user.name;
    if (lead.originalAuthor?.name) return lead.originalAuthor.name;
    return '-';
  };

  const getCustomerName = (lead: Lead): string => {
    const customer = getFirst(lead.customer);
    return cleanString(customer?.name);
  };

  const getCustomerPhone = (lead: Lead): string => {
    const customer = getFirst(lead.customer);
    if (!customer?.phone) return '-';
    // Strip +420 area code and trim
    const phone = customer.phone.replace(/^\+420\s*/, '').trim();
    return phone || '-';
  };

  const getCarDisplay = (lead: Lead): string => {
    const car = getFirst(lead.car);
    if (!car) return '-';
    const brand = cleanString(car.brand);
    const model = cleanString(car.model);
    if (brand !== '-' || model !== '-') {
      return `${brand !== '-' ? brand : ''} ${model !== '-' ? model : ''}`.trim() || '-';
    }
    return '-';
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };
  
  const handleRestoreLead = async (leadId: string) => {
    try {
      await axiosClient.post(`/leads/${leadId}/restoreLead`);
      await fetchLeads(true);
    } catch (err: any) {
      console.error('Failed to restore lead:', err);
      alert('Chyba při obnovení leadu: ' + (err.response?.data?.message || err.message));
    }
  };

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Leady</h1>
      </div>

      {/* Search and Filter row */}
      <div className="mb-4 flex gap-3">
        <div className="flex-1 relative">
          <svg 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Vyhledávání podle jména, příjmení, ID nebo telefonu..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <button
          onClick={() => setFilterOpen(true)}
          className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
            hasActiveFilters 
              ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FilterIcon className="w-5 h-5" />
          <span>Filtr</span>
          {hasActiveFilters && (
            <span className="bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {[appliedFilters.leadState, appliedFilters.leadSubState, appliedFilters.periodFilterType, appliedFilters.dealerId].filter(Boolean).length}
            </span>
          )}
        </button>

        <button
          onClick={() => navigate('/leads/new')}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Nový lead</span>
        </button>
      </div>
      
      {/* Page size selector */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Počet na stránku:</span>
        <div className="flex gap-1">
          {[10, 20, 50].map(size => (
            <button
              key={size}
              onClick={() => handleLimitChange(size)}
              className={`px-3 py-1 rounded border ${
                limit === size 
                  ? 'bg-red-600 text-white border-red-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Modal */}
      {filterOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setFilterOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-center mb-6">Filtr</h2>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Stav leadu</label>
                <select
                  value={forcedLeadState ?? filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  disabled={Boolean(forcedLeadState)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  {LEAD_STATES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Substatus leadu</label>
                <select
                  value={filterSubstate}
                  onChange={(e) => setFilterSubstate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  {LEAD_SUBSTATES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Období</label>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  {PERIOD_FILTERS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm text-gray-600 mb-1">Autor</label>
                <select
                  value={filterDealer}
                  onChange={(e) => setFilterDealer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Všechny</option>
                  {dealers.map(d => (
                    <option key={d.id} value={d.id}>{d.user?.name || 'Neznámý'}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleResetFilter}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Resetovat
                </button>
                <button
                  onClick={handleApplyFilter}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Potvrdit
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-[60px] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="w-[80px] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                <th className="w-[100px] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Zákazník</th>
                <th className="w-[90px] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
                <th className="w-[100px] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Auto</th>
                <th className="w-[90px] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="w-[90px] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Substatus</th>
                {!isAmApprovedPage && (
                  <th className="w-[70px] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Zdroj</th>
                )}
                {!isAmApprovedPage && (
                  <th className="w-[120px] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Obchodník</th>
                )}
                {!isAmApprovedPage && (
                  <th className="w-[90px] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Zadal</th>
                )}
                <th className="w-[80px] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kontakt</th>
                <th className="w-[120px] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Poznámky</th>
                <th className="w-[100px] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={tableColSpan} className="px-2 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    </div>
                  </td>
                </tr>
              ) : displayLeads.length === 0 ? (
                <tr>
                  <td colSpan={tableColSpan} className="px-2 py-8 text-center text-gray-500">
                    {searchQuery || hasActiveFilters ? 'Žádné výsledky pro zadaný dotaz' : 'Žádné leady'}
                  </td>
                </tr>
              ) : (
                displayLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 text-xs font-medium text-gray-900">
                      {lead.uniqueId || lead.id.slice(-6)}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-500">
                      {formatDateTime(lead.createdAt)}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 break-words">
                      {getCustomerName(lead)}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-500">
                      {getCustomerPhone(lead)}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 break-words">
                      {getCarDisplay(lead)}
                    </td>
                    <td className="px-2 py-2">
                      <span className={`px-1.5 py-0.5 text-xs rounded ${getStatusStyle(lead.status)}`}>
                        {normalizeLeadState(lead.status)}
                      </span>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {formatDateTime(lead.statusUpdatedAt || lead.updatedAt || lead.createdAt)}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-500 break-words">
                      {normalizeSubstatus(lead.subStatus || lead.declinedType || lead.notInterestedStatus)}
                    </td>
                    {!isAmApprovedPage && (
                      <td className="px-2 py-2 text-xs text-gray-500 break-words">
                        {getSourceDisplay(lead)}
                      </td>
                    )}
                    {!isAmApprovedPage && (
                      <td className="px-2 py-2 text-xs">
                        <div className="text-gray-900 break-words">{getDealerName(lead)}</div>
                        {lead.updatedAt && (
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {formatDateTime(lead.updatedAt)}
                          </div>
                        )}
                      </td>
                    )}
                    {!isAmApprovedPage && (
                      <td className="px-2 py-2 text-xs text-gray-500 break-words">
                        {getAuthorName(lead)}
                      </td>
                    )}
                    <td className="px-2 py-2 text-xs text-gray-500">
                      <div>{getContactDeltaHHMM(lead)}</div>
                      {getSubStatusDeltaHHMM(lead) && (
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          ΔSS {getSubStatusDeltaHHMM(lead)}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-500 break-words">
                      <div className="text-[10px] text-gray-400">
                        {getLeadLatestNoteAt(lead) ? formatDateTime(getLeadLatestNoteAt(lead) as string) : '-'}
                      </div>
                      <div className="mt-0.5">
                        {getLeadNoteMessage(lead)}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-xs">
                      <div className="flex gap-1">
                        {canOrder(lead.status) ? (
                          <button 
                            onClick={() => navigate(`/leads/${lead.id}/v2`)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Detail
                          </button>
                        ) : isDeclined(lead.status) ? (
                          <button 
                            onClick={() => handleRestoreLead(lead.id)}
                            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Obnovit
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center gap-2 py-4 border-t">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 px-4 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ←
          </button>
          <span className="px-4 py-2 bg-gray-100 rounded-full text-sm">
            Strana {page} z {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 px-4 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>
      </Card>
    </div>
  );
}

export default Leads;
