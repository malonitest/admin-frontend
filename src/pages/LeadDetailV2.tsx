import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { axiosClient } from '@/api/axiosClient';

interface LeadResponse {
  id: string;
  uniqueId?: number;
  status?: string;
  estimatedValue?: number | null;
  decidedAt?: string;
  amApprovedAt?: string;
  declinedAt?: string;
  documents?: {
    carDetectReport?: {
      _id?: string;
      file?: string;
      name?: string;
      documentType?: string;
    } | null;
  } | null;
  note?: Array<{
    message?: string;
    createdAt?: string;
    author?:
      | {
          id?: string;
          _id?: string;
          name?: string;
          email?: string;
        }
      | string
      | null;
  }>;
  customer?: {
    customerType?: string;
    name?: string;
    email?: string;
    phone?: string;
    birthday?: string;
    birthNumber?: string;
    companyID?: string;
    companyName?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    enableAddress2?: boolean;
    address2?: string;
    city2?: string;
    postalCode2?: string;
    bankAccount?: string;
  } | Array<{
    customerType?: string;
    name?: string;
    email?: string;
    phone?: string;
    birthday?: string;
    birthNumber?: string;
    companyID?: string;
    companyName?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    enableAddress2?: boolean;
    address2?: string;
    city2?: string;
    postalCode2?: string;
    bankAccount?: string;
  }>;
  car?: {
    VIN?: string;
    brand?: string;
    model?: string;
    registration?: number | null;
    carSPZ?: string;
    mileage?: number | null;
  } | Array<{
    VIN?: string;
    brand?: string;
    model?: string;
    registration?: number | null;
    carSPZ?: string;
    mileage?: number | null;
  }>;
  lease?: {
    leaseAmount?: number | null;
    rentDuration?: number | null;
    monthlyPayment?: number | null;
    rentOffer?: number | null;
    yearlyInterestRate?: number | null;
    yearlyInsuranceFee?: number | null;
    payoutInCash?: boolean;
    adminFee?: number | null;
  } | Array<{
    leaseAmount?: number | null;
    rentDuration?: number | null;
    monthlyPayment?: number | null;
    rentOffer?: number | null;
    yearlyInterestRate?: number | null;
    yearlyInsuranceFee?: number | null;
    payoutInCash?: boolean;
    adminFee?: number | null;
  }>;
  assignedSalesManager?: { id?: string; _id?: string; name?: string } | string;
  salesVisitAt?: string;
}

type LeadNote = NonNullable<LeadResponse['note']>[number];

interface Dealer {
  id?: string;
  _id?: string;
  name?: string;
  user?: { name?: string };
}

type FormState = {
  customerType: string;
  companyID: string;
  companyName: string;
  customerName: string;
  email: string;
  phone: string;
  birthday: string;
  birthNumber: string;
  bankAccount: string;

  address: string;
  city: string;
  postalCode: string;

  enableAddress2: boolean;
  address2: string;
  city2: string;
  postalCode2: string;

  vin: string;
  brand: string;
  model: string;
  registration: string;
  carSPZ: string;
  mileage: string;

  marketPrice: string;

  requestedAmount: string;
  rentDuration: string;
  monthlyPayment: string;
  yearlyInterestRate: string;
  yearlyInsuranceFee: string;
  payoutInCash: boolean;
  adminFee: string;

  assignedTechnician: string;
  salesVisitAt: string;
  salesVisitTime: string;
};

const cleanUndefinedAddress = (value?: string): string => {
  if (!value) return '';
  const trimmed = value.trim();
  return trimmed === 'undefined undefined' ? '' : trimmed;
};

const toIntOrUndefined = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeDecimal = (value: string): string => value.replace(',', '.').trim();

const toFloatOrUndefined = (value: string): number | undefined => {
  const normalized = normalizeDecimal(value);
  if (!normalized) return undefined;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toISODateOrUndefined = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? undefined : trimmed;
};

const toISODateTimeOrUndefined = (dateValue: string, timeValue: string): string | undefined => {
  const dateTrimmed = dateValue.trim();
  if (!dateTrimmed) return undefined;

  const timeTrimmed = timeValue.trim();
  if (!timeTrimmed) return toISODateOrUndefined(dateTrimmed);

  const combined = `${dateTrimmed}T${timeTrimmed}`;
  const date = new Date(combined);
  return Number.isNaN(date.getTime()) ? undefined : combined;
};

const toObjectIdOrUndefined = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return /^[a-fA-F0-9]{24}$/.test(trimmed) ? trimmed : undefined;
};

const emptyFormState: FormState = {
  customerType: '',
  companyID: '',
  companyName: '',
  customerName: '',
  email: '',
  phone: '',
  birthday: '',
  birthNumber: '',
  bankAccount: '',

  address: '',
  city: '',
  postalCode: '',

  enableAddress2: false,
  address2: '',
  city2: '',
  postalCode2: '',

  vin: '',
  brand: '',
  model: '',
  registration: '',
  carSPZ: '',
  mileage: '',

  marketPrice: '',

  requestedAmount: '',
  rentDuration: '',
  monthlyPayment: '',
  yearlyInterestRate: '',
  yearlyInsuranceFee: '',
  payoutInCash: false,
  adminFee: '5000',

  assignedTechnician: '',
  salesVisitAt: '',
  salesVisitTime: '',
};

const getFirst = <T,>(value: T | T[] | undefined): T | undefined => {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

const leadToForm = (lead: LeadResponse): FormState => {
  const customer = getFirst(lead.customer);
  const car = getFirst(lead.car);
  const lease = getFirst(lead.lease);

  const assignedId =
    typeof lead.assignedSalesManager === 'object'
      ? (lead.assignedSalesManager?.id || (lead.assignedSalesManager as any)?._id || '')
      : (lead.assignedSalesManager || '');

  const monthlyPayment = lease?.monthlyPayment ?? lease?.rentOffer ?? null;

  const salesVisitIso = lead.salesVisitAt ? String(lead.salesVisitAt) : '';
  const salesVisitDate = salesVisitIso ? salesVisitIso.split('T')[0] : '';
  const salesVisitTime = salesVisitIso && salesVisitIso.includes('T')
    ? salesVisitIso.split('T')[1]?.slice(0, 5) || ''
    : '';

  return {
    ...emptyFormState,
    customerType: customer?.customerType || '',
    companyID: customer?.companyID || '',
    companyName: customer?.companyName || '',
    customerName: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    birthday: customer?.birthday ? String(customer.birthday).split('T')[0] : '',
    birthNumber: customer?.birthNumber || '',
    bankAccount: customer?.bankAccount || '',

    address: cleanUndefinedAddress(customer?.address),
    city: customer?.city || '',
    postalCode: customer?.postalCode || '',

    enableAddress2: Boolean(customer?.enableAddress2),
    address2: customer?.address2 || '',
    city2: customer?.city2 || '',
    postalCode2: customer?.postalCode2 || '',

    vin: car?.VIN || '',
    brand: car?.brand || '',
    model: car?.model || '',
    registration: car?.registration != null ? String(car.registration) : '',
    carSPZ: car?.carSPZ || '',
    mileage: car?.mileage != null ? String(car.mileage) : '',

    marketPrice: lead.estimatedValue != null ? String(lead.estimatedValue) : '',

    requestedAmount: lease?.leaseAmount != null ? String(lease.leaseAmount) : '',
    rentDuration: lease?.rentDuration != null ? String(lease.rentDuration) : '',
    monthlyPayment: monthlyPayment != null ? String(monthlyPayment) : '',
    yearlyInterestRate: lease?.yearlyInterestRate != null ? String(lease.yearlyInterestRate) : '',
    yearlyInsuranceFee: lease?.yearlyInsuranceFee != null ? String(lease.yearlyInsuranceFee) : '',
    payoutInCash: Boolean(lease?.payoutInCash),
    adminFee: lease?.adminFee != null ? String(lease.adminFee) : '5000',

    assignedTechnician: assignedId,
    salesVisitAt: salesVisitDate,
    salesVisitTime,
  };
};

export default function LeadDetailV2() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [lead, setLead] = useState<LeadResponse | null>(null);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [form, setForm] = useState<FormState>(emptyFormState);
  const [noteDraft, setNoteDraft] = useState('');
  const [generatingCarDetect, setGeneratingCarDetect] = useState(false);
  const [settingAmApproved, setSettingAmApproved] = useState(false);
  const [settingDeclined, setSettingDeclined] = useState(false);
  const [showDeclineReasons, setShowDeclineReasons] = useState(false);
  const [declineType, setDeclineType] = useState<string>('OTHER');

  const rentDurationMonths = Number.parseInt(form.rentDuration || '', 10) || 0;
  const monthlyPayment = Number.parseInt(form.monthlyPayment || '', 10) || 0;
  const yearlyInsuranceFee = Number.parseInt(form.yearlyInsuranceFee || '', 10) || 0;

  const totalInsuranceForDuration = useMemo(() => {
    return rentDurationMonths > 0 && yearlyInsuranceFee > 0
      ? Math.round((rentDurationMonths / 12) * yearlyInsuranceFee)
      : 0;
  }, [rentDurationMonths, yearlyInsuranceFee]);

  const insurancePerMonthForDuration = useMemo(() => {
    return rentDurationMonths > 0 && totalInsuranceForDuration > 0
      ? Math.round(totalInsuranceForDuration / rentDurationMonths)
      : 0;
  }, [rentDurationMonths, totalInsuranceForDuration]);

  const monthlyRentIncludingInsurance = useMemo(() => {
    return (monthlyPayment > 0 ? monthlyPayment : 0) + insurancePerMonthForDuration;
  }, [monthlyPayment, insurancePerMonthForDuration]);

  const totalRent = useMemo(() => {
    return rentDurationMonths > 0 && monthlyPayment > 0
      ? (rentDurationMonths * monthlyPayment) + totalInsuranceForDuration
      : 0;
  }, [rentDurationMonths, monthlyPayment, totalInsuranceForDuration]);

  useEffect(() => {
    const fetchAll = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [leadRes, dealersRes] = await Promise.all([
          axiosClient.get(`/leads/${id}`),
          axiosClient.get('/dealers?limit=100'),
        ]);

        const leadData: LeadResponse = leadRes.data;
        setLead(leadData);
        setForm(leadToForm(leadData));

        setDealers(dealersRes.data.results || []);
      } catch (e) {
        console.error('Failed to load lead:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value as any }));
  };

  const handleCalculateRent = () => {
    const leaseAmount = Number.parseInt(form.requestedAmount || '', 10) || 0;
    const percent = Number.parseFloat(normalizeDecimal(form.yearlyInterestRate || '')) || 0;

    if (leaseAmount <= 0 || percent <= 0) {
      alert('Vyplňte prosím: Žádaná částka a Výše nájemného (%).');
      return;
    }

    const calculatedMonthlyPayment = Math.round((leaseAmount * (percent / 100)) / 12);
    setForm((prev) => ({ ...prev, monthlyPayment: String(calculatedMonthlyPayment) }));
  };

  const showCompanyFields =
    form.customerType === 'COMPANY' || Boolean(form.companyID) || Boolean(form.companyName);

  const formatNoteAuthor = (author: LeadNote['author']): string => {
    if (!author) return 'Neznámý';
    if (typeof author === 'string') return author;
    return author.name || author.email || author._id || author.id || 'Neznámý';
  };

  const formatNoteDateTime = (value?: string): string => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('cs-CZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLeadStatus = (status?: string): string => {
    switch (status) {
      case 'CONCEPT':
        return 'Koncept';
      case 'NEW':
        return 'Nový';
      case 'AWAITS_APPROVAL':
        return 'Čeká na schválení';
      case 'SUPERVISOR_APPROVED':
        return 'Schválen AM';
      case 'CUSTOMER_APPROVED':
        return 'Schválen klientem';
      case 'ASSIGNED':
        return 'Přiřazeno';
      case 'SENT_TO_OZ':
        return 'Odesláno OZ';
      case 'SALES_APPROVED':
        return 'Schváleno sales';
      case 'UPLOAD_DOCUMENTS':
        return 'Nahrát dokumenty';
      case 'FINAL_APPROVAL':
        return 'Finální schválení';
      case 'RETURNED_TO_SALES':
        return 'Vráceno sales';
      case 'CONVERTED':
        return 'Konvertováno';
      case 'DECLINED':
        return 'Zamítnuto';
      default:
        return status || '';
    }
  };

  const declineReasonOptions: Array<{ value: string; label: string }> = [
    { value: 'CAR_NOT_OWNED', label: 'Vozidlo není ve vlastnictví' },
    { value: 'CAR_LEASED', label: 'Vozidlo je na leasing' },
    { value: 'CAR_LOW_VALUE', label: 'Nízká hodnota vozu' },
    { value: 'CAR_OLD', label: 'Vozidlo je příliš staré' },
    { value: 'CAR_BAD_TECHNICAL_STATE', label: 'Špatný technický stav' },
    { value: 'CAR_HIGH_MILEAGE', label: 'Vysoký nájezd' },
    { value: 'CAR_DENIED_BY_TECHNICIAN', label: 'Zamítnuto technikem' },
    { value: 'CAR_BURDENED', label: 'Vozidlo je zatížené (břemeno/zástava)' },
    { value: 'CUSTOMER_NOT_INTERESTED_BUY', label: 'Klient nemá zájem' },
    { value: 'CUSTOMER_NOT_ELIGIBLE', label: 'Klient nesplňuje podmínky' },
    { value: 'CUSTOMER_PRICE_DISADVANTAGEOUS', label: 'Cena je pro klienta nevýhodná' },
    { value: 'CUSTOMER_SOLVED_ELSEWHERE', label: 'Klient to vyřešil jinde' },
    { value: 'CAR_LOSS_RISK', label: 'Vysoké riziko ztráty' },
    { value: 'HIGH_INSTALLMENTS', label: 'Příliš vysoké splátky' },
    { value: 'OTHER', label: 'Jiný důvod' },
  ];

  const getDeclineReasonLabel = (value: string): string => {
    return declineReasonOptions.find((o) => o.value === value)?.label || value;
  };

  const handleAddNote = async () => {
    if (!id) return;
    const trimmed = noteDraft.trim();
    if (!trimmed) return;

    setAddingNote(true);
    try {
      const updateRes = await axiosClient.patch(`/leads/${id}`, {
        noteMessage: trimmed,
      });

      if (updateRes?.data && updateRes.data.success === false) {
        throw new Error(updateRes.data.message || 'Nepodařilo se přidat poznámku');
      }

      const updatedLead: LeadResponse | undefined = updateRes?.data?.data;
      if (updatedLead) {
        setLead(updatedLead);
      } else {
        const refreshed = await axiosClient.get(`/leads/${id}`);
        const refreshedLead: LeadResponse = refreshed.data;
        setLead(refreshedLead);
      }

      setNoteDraft('');
    } catch (e) {
      console.error('Failed to add note:', e);
      const message = e instanceof Error ? e.message : 'Nepodařilo se přidat poznámku';
      alert(message || 'Nepodařilo se přidat poznámku');
    } finally {
      setAddingNote(false);
    }
  };

  const handleGenerateCarDetectReport = async () => {
    if (!id) return;
    if (!form.vin.trim()) {
      alert('Vyplňte prosím VIN vozu.');
      return;
    }

    const downloadDocumentFile = async (documentFile: string, filename: string) => {
      try {
        const resp = await axiosClient.get(`/documents/download/${encodeURIComponent(documentFile)}`, {
          responseType: 'blob',
        });
        const blob = resp.data instanceof Blob ? resp.data : new Blob([resp.data]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Failed to download CarDetect PDF via blob:', err);

        // Fallback: open download URL in a new tab (lets the browser handle the file).
        const base = (axiosClient.defaults.baseURL || '').replace(/\/$/, '');
        const url = `${base}/documents/download/${encodeURIComponent(documentFile)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    };

    setGeneratingCarDetect(true);
    try {
      const genRes = await axiosClient.post(`/leads/${id}/generateCarDetectReport`, {
        vin: form.vin.trim(),
      });

      const refreshed = await axiosClient.get(`/leads/${id}`);
      const refreshedLead: LeadResponse = refreshed.data;
      setLead(refreshedLead);
      setForm(leadToForm(refreshedLead));

      const documentFile =
        (genRes as any)?.data?.data?.file || (refreshedLead as any)?.documents?.carDetectReport?.file;

      if (typeof documentFile === 'string' && documentFile) {
        const fileNameBase = refreshedLead?.uniqueId ? `CarDetect_${refreshedLead.uniqueId}` : `CarDetect_${id}`;
        const filename = fileNameBase.endsWith('.pdf') ? fileNameBase : `${fileNameBase}.pdf`;
        await downloadDocumentFile(documentFile, filename);
      }

      alert('CarDetect report byl vygenerován a uložen k leadu.');
    } catch (e) {
      const status = (e as any)?.response?.status as number | undefined;
      const message = (e as any)?.response?.data?.message as string | undefined;

      // Backward-compatible fallback:
      // some deployments/revisions may not have /generateCarDetectReport yet.
      if (status === 404) {
        try {
          // Trigger existing backend behavior: when VIN changes on update, backend refreshes CarDetect.
          await axiosClient.patch(`/leads/${id}`, {
            car: {
              VIN: form.vin.trim(),
            },
          });

          const refreshed = await axiosClient.get(`/leads/${id}`);
          const refreshedLead: LeadResponse = refreshed.data;
          setLead(refreshedLead);
          setForm(leadToForm(refreshedLead));

          if ((refreshedLead as any)?.documents?.carDetectReport) {
            const documentFile = (refreshedLead as any)?.documents?.carDetectReport?.file;
            if (typeof documentFile === 'string' && documentFile) {
              const fileNameBase = refreshedLead?.uniqueId ? `CarDetect_${refreshedLead.uniqueId}` : `CarDetect_${id}`;
              const filename = fileNameBase.endsWith('.pdf') ? fileNameBase : `${fileNameBase}.pdf`;
              await downloadDocumentFile(documentFile, filename);
            }
            alert('CarDetect report byl vygenerován a uložen k leadu.');
          } else {
            alert('CarDetect report se nepodařilo vygenerovat. Zkuste nejdřív uložit lead a pak znovu.');
          }
          return;
        } catch (fallbackError) {
          console.error('CarDetect fallback failed:', fallbackError);
          alert('Nepodařilo se vygenerovat CarDetect report');
          return;
        }
      }

      console.error('Failed to generate CarDetect report:', e);
      if (status === 400) {
        alert(message || 'Nepodařilo se vygenerovat CarDetect report (zkontrolujte VIN / uložte lead).');
      } else {
        alert('Nepodařilo se vygenerovat CarDetect report');
      }
    } finally {
      setGeneratingCarDetect(false);
    }
  };

  const refreshLead = async () => {
    if (!id) return;
    const refreshed = await axiosClient.get(`/leads/${id}`);
    const refreshedLead: LeadResponse = refreshed.data;
    setLead(refreshedLead);
    setForm(leadToForm(refreshedLead));
  };

  const handleSetAmApproved = async () => {
    if (!id) return;
    setSettingAmApproved(true);
    try {
      await axiosClient.post(`/leads/${id}/supervisor/approve`);
      await refreshLead();
    } catch (e) {
      console.error('Failed to set AM approved:', e);
      alert('Nepodařilo se nastavit status "Schválen AM"');
    } finally {
      setSettingAmApproved(false);
    }
  };

  const handleSetDeclined = async () => {
    setShowDeclineReasons(true);
  };

  const handleConfirmDecline = async () => {
    if (!id) return;
    setSettingDeclined(true);
    try {
      await axiosClient.post(`/leads/${id}/decline`, {
        type: declineType,
        reason: getDeclineReasonLabel(declineType),
      });
      setShowDeclineReasons(false);
      await refreshLead();
    } catch (e) {
      console.error('Failed to decline lead:', e);
      alert('Nepodařilo se zamítnout lead');
    } finally {
      setSettingDeclined(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const monthlyPaymentNumber = toIntOrUndefined(form.monthlyPayment);

      const updateRes = await axiosClient.patch(`/leads/${id}`, {
        estimatedValue: toIntOrUndefined(form.marketPrice),
        customer: {
          customerType: form.customerType || undefined,
          companyID: showCompanyFields ? (form.companyID || undefined) : undefined,
          companyName: showCompanyFields ? (form.companyName || undefined) : undefined,
          name: form.customerName || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          birthday: toISODateOrUndefined(form.birthday),
          birthNumber: form.birthNumber || undefined,
          bankAccount: form.bankAccount || undefined,
          address: form.address || undefined,
          city: form.city || undefined,
          postalCode: form.postalCode || undefined,
          enableAddress2: form.enableAddress2,
          address2: form.enableAddress2 ? (form.address2 || undefined) : undefined,
          city2: form.enableAddress2 ? (form.city2 || undefined) : undefined,
          postalCode2: form.enableAddress2 ? (form.postalCode2 || undefined) : undefined,
        },
        car: {
          VIN: form.vin || undefined,
          brand: form.brand || undefined,
          model: form.model || undefined,
          registration: toIntOrUndefined(form.registration),
          carSPZ: form.carSPZ || undefined,
          mileage: toIntOrUndefined(form.mileage),
        },
        lease: {
          leaseAmount: toIntOrUndefined(form.requestedAmount),
          rentDuration: toIntOrUndefined(form.rentDuration),
          monthlyPayment: monthlyPaymentNumber,
          rentOffer: monthlyPaymentNumber,
          yearlyInterestRate: toFloatOrUndefined(form.yearlyInterestRate),
          yearlyInsuranceFee: toIntOrUndefined(form.yearlyInsuranceFee),
          payoutInCash: form.payoutInCash,
          adminFee: toIntOrUndefined(form.adminFee),
        },
        assignedSalesManager: toObjectIdOrUndefined(form.assignedTechnician),
        salesVisitAt: toISODateTimeOrUndefined(form.salesVisitAt, form.salesVisitTime),
      });

      // Some backend paths return HTTP 200 with { success: false }.
      // Treat that as a real error so the user isn't told "Uloženo" when nothing changed.
      if (updateRes?.data && updateRes.data.success === false) {
        throw new Error(updateRes.data.message || 'Nepodařilo se uložit');
      }

      // Keep the user's edited values visible.
      // Some environments can return stale data immediately after write, so
      // overwriting the form from server response can make inputs "disappear".
      const updatedLead: LeadResponse | undefined = updateRes?.data?.data;
      if (updatedLead) {
        setLead(updatedLead);
      } else {
        const refreshed = await axiosClient.get(`/leads/${id}`);
        const refreshedLead: LeadResponse = refreshed.data;
        setLead(refreshedLead);
      }

      alert('Uloženo');
    } catch (e) {
      console.error('Failed to save lead:', e);
      const message = e instanceof Error ? e.message : 'Nepodařilo se uložit';
      alert(message || 'Nepodařilo se uložit');
    } finally {
      setSaving(false);
    }
  };

  const technicianOptions = useMemo(() => {
    return dealers
      .filter((dealer) => {
        const name = dealer.name || dealer.user?.name || '';
        return name.includes('Martin Dyntar') || name.includes('Michael Dyntar');
      })
      .map((dealer) => ({
        id: dealer.id || dealer._id || '',
        label: dealer.name || dealer.user?.name || 'Neznámý',
      }))
      .filter((d) => d.id);
  }, [dealers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Načítám...</div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Lead nenalezen</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/leads')} className="p-1 hover:bg-red-700 rounded">
          ←
        </button>
        <h1 className="text-lg font-semibold">Detail leadu (V2)</h1>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">ID</label>
              <input value={lead.uniqueId ?? ''} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Jméno a příjmení zákazníka</label>
              <input value={form.customerName} onChange={handleChange('customerName')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">E-mail zákazníka</label>
              <input type="email" value={form.email} onChange={handleChange('email')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Telefon zákazníka</label>
              <input value={form.phone} onChange={handleChange('phone')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Datum narození zákazníka</label>
              <input type="date" value={form.birthday} onChange={handleChange('birthday')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Rodné číslo</label>
              <input value={form.birthNumber} onChange={handleChange('birthNumber')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Ulice</label>
              <input value={form.address} onChange={handleChange('address')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Město</label>
              <input value={form.city} onChange={handleChange('city')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">PSČ</label>
              <input value={form.postalCode} onChange={handleChange('postalCode')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            {showCompanyFields && (
              <>
                <div className="text-xs text-gray-500">Jedná se o firemního klienta.</div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">IČO</label>
                  <input value={form.companyID} onChange={handleChange('companyID')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Název společnosti</label>
                  <input value={form.companyName} onChange={handleChange('companyName')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.enableAddress2} onChange={handleChange('enableAddress2')} className="w-4 h-4" />
              <span className="text-sm">Přidat korespondenční adresu</span>
            </div>

            {form.enableAddress2 && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Korespondenční ulice</label>
                  <input value={form.address2} onChange={handleChange('address2')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Korespondenční město</label>
                  <input value={form.city2} onChange={handleChange('city2')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Korespondenční PSČ</label>
                  <input value={form.postalCode2} onChange={handleChange('postalCode2')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-lg p-4 shadow space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">VIN číslo auta</label>
              <input value={form.vin} onChange={handleChange('vin')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Značka auta</label>
              <input value={form.brand} onChange={handleChange('brand')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Model auta</label>
              <input value={form.model} onChange={handleChange('model')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rok výroby auta</label>
              <input value={form.registration} onChange={handleChange('registration')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">SPZ</label>
              <input value={form.carSPZ} onChange={handleChange('carSPZ')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nájezd vozidla (km)</label>
              <input value={form.mileage} onChange={handleChange('mileage')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Poznámky</label>
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Napište poznámku..."
              />
              <button
                type="button"
                onClick={handleAddNote}
                disabled={addingNote || !noteDraft.trim()}
                className="mt-2 w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {addingNote ? 'Ukládám poznámku...' : 'Přidat poznámku'}
              </button>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Historie poznámek</label>
              <div className="border border-gray-200 rounded-lg p-2 max-h-64 overflow-auto bg-gray-50">
                {lead.note && lead.note.length > 0 ? (
                  <div className="space-y-2">
                    {lead.note.map((n, idx) => (
                      <div key={`${n.createdAt || idx}`} className="bg-white border border-gray-200 rounded-md p-2">
                        <div className="text-xs text-gray-500 flex items-center justify-between gap-2">
                          <span>{formatNoteAuthor(n.author)}</span>
                          <span>{formatNoteDateTime(n.createdAt)}</span>
                        </div>
                        <div className="text-sm text-gray-800 whitespace-pre-wrap">{n.message || ''}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Zatím bez poznámek</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tržní cena</label>
              <input type="number" value={form.marketPrice} onChange={handleChange('marketPrice')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Žádaná částka</label>
              <input type="number" value={form.requestedAmount} onChange={handleChange('requestedAmount')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Číslo bankovního účtu</label>
              <input value={form.bankAccount} onChange={handleChange('bankAccount')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            <button type="button" className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Generovat nabídku
            </button>

            <button
              type="button"
              onClick={handleGenerateCarDetectReport}
              disabled={generatingCarDetect}
              className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {generatingCarDetect ? 'Generuji CarDetect report...' : 'CarDetect Report'}
            </button>

            <button type="button" className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Dokumenty
            </button>

            <button type="button" className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Fotogalerie
            </button>
          </div>

          <div className="bg-white rounded-lg p-4 shadow space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Délka smlouvy (měsíce)</label>
              <input type="number" value={form.rentDuration} onChange={handleChange('rentDuration')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Měsíční nájemné (Kč)</label>
              <input type="number" value={form.monthlyPayment} onChange={handleChange('monthlyPayment')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Výše nájemného (%)</label>
              <input value={form.yearlyInterestRate} onChange={handleChange('yearlyInterestRate')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Částka ročního pojištění (Kč)</label>
              <input type="number" value={form.yearlyInsuranceFee} onChange={handleChange('yearlyInsuranceFee')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Výše poplatku (Kč)</label>
              <input type="number" value={form.adminFee} onChange={handleChange('adminFee')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Měsíční nájem včetně pojištění (Kč)</label>
              <input
                readOnly
                value={monthlyRentIncludingInsurance ? monthlyRentIncludingInsurance.toLocaleString('cs-CZ') : ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Celkový nájem za dobu (Kč) vč. pojištění</label>
              <input
                readOnly
                value={totalRent ? totalRent.toLocaleString('cs-CZ') : ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <button
              type="button"
              onClick={handleCalculateRent}
              className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Vypočítat nájem
            </button>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Přiřazení technika</label>
              <select
                value={form.assignedTechnician}
                onChange={(e) => setForm((prev) => ({ ...prev, assignedTechnician: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Vyberte technika</option>
                {technicianOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Datum návštěvy technika</label>
              <input type="date" value={form.salesVisitAt} onChange={handleChange('salesVisitAt')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Čas návštěvy technika</label>
              <input type="time" value={form.salesVisitTime} onChange={handleChange('salesVisitTime')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-600 space-y-1">
            {lead?.status ? (
              <div>
                Status: <span className="font-medium">{formatLeadStatus(lead.status)}</span>
              </div>
            ) : null}
            {lead?.amApprovedAt ? (
              <div>
                Schválen AM: <span className="font-medium">{formatNoteDateTime(lead.amApprovedAt)}</span>
              </div>
            ) : null}
            {lead?.declinedAt ? (
              <div>
                Zamítnuto: <span className="font-medium">{formatNoteDateTime(lead.declinedAt)}</span>
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={handleSetDeclined}
              disabled={saving || settingDeclined || settingAmApproved}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 font-medium"
            >
              Zamítnout
            </button>

            <button
              onClick={handleSetAmApproved}
              disabled={saving || settingDeclined || settingAmApproved}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {settingAmApproved ? 'Nastavuji...' : 'Schválen AM'}
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
            >
              {saving ? 'Ukládám...' : 'Uložit změny'}
            </button>
          </div>
        </div>

        {showDeclineReasons ? (
          <div className="mt-3 bg-white rounded-lg p-4 shadow border border-gray-200">
            <div className="text-sm font-medium text-gray-800 mb-2">Důvod zamítnutí</div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <select
                value={declineType}
                onChange={(e) => setDeclineType(e.target.value)}
                className="w-full md:flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              >
                {declineReasonOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeclineReasons(false)}
                  disabled={settingDeclined}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Zrušit
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDecline}
                  disabled={settingDeclined}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  {settingDeclined ? 'Ukládám...' : 'Potvrdit zamítnutí'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
