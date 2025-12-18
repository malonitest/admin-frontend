import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { axiosClient } from '@/api/axiosClient';

interface LeadResponse {
  id: string;
  uniqueId?: number;
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

  requestedAmount: string;
  rentDuration: string;
  monthlyPayment: string;
  yearlyInterestRate: string;
  yearlyInsuranceFee: string;
  payoutInCash: boolean;
  adminFee: string;

  assignedTechnician: string;
  salesVisitAt: string;
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

  requestedAmount: '',
  rentDuration: '',
  monthlyPayment: '',
  yearlyInterestRate: '',
  yearlyInsuranceFee: '',
  payoutInCash: false,
  adminFee: '5000',

  assignedTechnician: '',
  salesVisitAt: '',
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

    requestedAmount: lease?.leaseAmount != null ? String(lease.leaseAmount) : '',
    rentDuration: lease?.rentDuration != null ? String(lease.rentDuration) : '',
    monthlyPayment: monthlyPayment != null ? String(monthlyPayment) : '',
    yearlyInterestRate: lease?.yearlyInterestRate != null ? String(lease.yearlyInterestRate) : '',
    yearlyInsuranceFee: lease?.yearlyInsuranceFee != null ? String(lease.yearlyInsuranceFee) : '',
    payoutInCash: Boolean(lease?.payoutInCash),
    adminFee: lease?.adminFee != null ? String(lease.adminFee) : '5000',

    assignedTechnician: assignedId,
    salesVisitAt: lead.salesVisitAt ? String(lead.salesVisitAt).split('T')[0] : '',
  };
};

export default function LeadDetailV2() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lead, setLead] = useState<LeadResponse | null>(null);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [form, setForm] = useState<FormState>(emptyFormState);

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

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const monthlyPaymentNumber = toIntOrUndefined(form.monthlyPayment);

      const updateRes = await axiosClient.patch(`/leads/${id}`, {
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
        salesVisitAt: toISODateOrUndefined(form.salesVisitAt),
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
          </div>

          <div className="bg-white rounded-lg p-4 shadow space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Žádaná částka</label>
              <input type="number" value={form.requestedAmount} onChange={handleChange('requestedAmount')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Číslo bankovního účtu</label>
              <input value={form.bankAccount} onChange={handleChange('bankAccount')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            {showCompanyFields && (
              <>
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

            <div>
              <label className="block text-xs text-gray-500 mb-1">Datum návštěvy technika</label>
              <input type="date" value={form.salesVisitAt} onChange={handleChange('salesVisitAt')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
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
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
          >
            {saving ? 'Ukládám...' : 'Uložit změny'}
          </button>
        </div>
      </div>
    </div>
  );
}
