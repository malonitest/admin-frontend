import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { axiosClient } from '@/api/axiosClient';
import { tryFormatDateTimePrague } from '@/utils/dateTime';

type LeadDocument = {
  _id?: string;
  file?: string;
  name?: string;
  documentType?: string;
};

type PendingPhoto = { file: File; preview: string };

const MAX_PHOTOS = 5;

interface LeadResponse {
  id: string;
  uniqueId?: number;
  status?: string;
  estimatedValue?: number | null;
  decidedAt?: string;
  amApprovedAt?: string;
  declinedAt?: string;
  subStatus?: string | null;
  subStatusHistory?: Array<{
    subStatus?: string;
    changedAt?: string;
    changedBy?: { id?: string; _id?: string; name?: string; user?: { name?: string } } | string | null;
  }>;
  carDetectReportOk?: boolean;
  executionOk?: boolean;
  documents?: {
    carDetectReport?: LeadDocument | null;
    carVIN?: LeadDocument | null;
    carMileage?: LeadDocument | null;
    carExterior?: LeadDocument[] | null;
    carInterior?: LeadDocument[] | null;
    carVTP?: LeadDocument[] | null;
    carMTP?: LeadDocument[] | null;
    greenCard?: LeadDocument | null;
    evidence?: LeadDocument[] | null;
    insurance?: LeadDocument[] | null;
    insuranceEnds?: string | null;
    buyAgreement?: LeadDocument[] | null;
    rentAgreement?: LeadDocument[] | null;
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
    numberMTP?: string;
    numberVTP?: string;
  } | Array<{
    VIN?: string;
    brand?: string;
    model?: string;
    registration?: number | null;
    carSPZ?: string;
    mileage?: number | null;
    numberMTP?: string;
    numberVTP?: string;
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

function PhotoUploadModal({
  isOpen,
  onClose,
  title,
  existing,
  allowMultiple,
  uploading,
  onUploadFiles,
  downloadUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  existing: LeadDocument[];
  allowMultiple: boolean;
  uploading: boolean;
  onUploadFiles: (files: File[]) => Promise<void>;
  downloadUrl: (documentFile: string) => string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  useEffect(() => {
    if (isOpen) {
      setPending([]);
      setDragActive(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const addPending = async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const limitedByMode = allowMultiple ? imageFiles : imageFiles.slice(0, 1);

    const remainingSlots = MAX_PHOTOS - pending.length;
    const limited = allowMultiple ? limitedByMode.slice(0, Math.max(0, remainingSlots)) : limitedByMode.slice(0, 1);
    if (limited.length === 0) return;

    await Promise.all(
      limited.map(
        (file) =>
          new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              setPending((prev) => {
                if (!allowMultiple) {
                  return [{ file, preview: String(reader.result || '') }];
                }
                return prev.length >= MAX_PHOTOS ? prev : [...prev, { file, preview: String(reader.result || '') }];
              });
              resolve();
            };
            reader.readAsDataURL(file);
          })
      )
    );
  };

  const saveAndClose = async () => {
    try {
      if (pending.length > 0) {
        await onUploadFiles(pending.map((p) => p.file));
      }
    } finally {
      onClose();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    await addPending(files);
  };

  const existingWithFile = existing.filter((d) => typeof d?.file === 'string' && d.file);

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[92vh] overflow-y-auto mx-2 sm:mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                void saveAndClose();
              }}
              disabled={uploading}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Zavřít
            </button>
          </div>

          <div className="p-4">
            <div
              className={`border-2 border-dashed rounded-lg p-4 mb-4 transition-colors ${
                dragActive ? 'border-red-600 bg-red-50' : 'border-gray-300'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setDragActive(false);
                const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith('image/'));
                await addPending(files);
              }}
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple={allowMultiple}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple={allowMultiple}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || (!allowMultiple && pending.length >= 1) || pending.length >= MAX_PHOTOS}
                  className="flex-1 w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-gray-700"
                >
                  {uploading ? 'Nahrávám...' : 'Nahrát z počítače'}
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={uploading || (!allowMultiple && pending.length >= 1) || pending.length >= MAX_PHOTOS}
                  className="flex-1 w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white"
                >
                  Vyfotit
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-3">
                {dragActive ? 'Pusťte fotky zde…' : 'nebo přetáhněte fotky sem (drag & drop)'}
              </p>
              <p className="text-xs text-gray-500 text-center mt-1">
                Připraveno {pending.length} z {MAX_PHOTOS} fotek
              </p>
            </div>

            {pending.length > 0 ? (
              <div className="mb-4">
                <div className="text-xs text-gray-600 mb-2">Nové fotky (uloží se po Hotovo/Zavřít)</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {pending.map((p, index) => (
                    <div key={`${p.file.name}-${p.file.size}-${index}`} className="relative group">
                      <img src={p.preview} alt={`Nová fotka ${index + 1}`} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPending((prev) => prev.filter((_, i) => i !== index));
                        }}
                        className="absolute top-1 right-1 px-2 py-1 text-xs bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {existingWithFile.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {existingWithFile.map((doc, index) => (
                  <div key={`${doc._id || doc.file || index}`} className="relative">
                    <img
                      src={downloadUrl(doc.file as string)}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer"
                      loading="lazy"
                      onClick={() => {
                        const url = downloadUrl(doc.file as string);
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>Zatím žádné fotografie</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                void saveAndClose();
              }}
              disabled={uploading}
              className="w-full py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
            >
              Hotovo
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

type LeadNote = NonNullable<LeadResponse['note']>[number];

interface Dealer {
  id?: string;
  _id?: string;
  name?: string;
  user?: { name?: string };
}

const LEAD_SUBSTATES: Array<{ value: string; label: string }> = [
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

const normalizeSubstatus = (type: string | undefined | null): string => {
  if (!type) return '-';
  return LEAD_SUBSTATES.find((s) => s.value === type)?.label || type;
};

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
  const [savingLeadChecks, setSavingLeadChecks] = useState(false);
  const [settingAmApproved, setSettingAmApproved] = useState(false);
  const [settingDeclined, setSettingDeclined] = useState(false);
  const [showDeclineReasons, setShowDeclineReasons] = useState(false);
  const [declineType, setDeclineType] = useState<string>('OTHER');

  const [showSubStatusPicker, setShowSubStatusPicker] = useState(false);
  const [subStatusDraft, setSubStatusDraft] = useState<string>('');
  const [settingSubStatus, setSettingSubStatus] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [documentsView, setDocumentsView] = useState<
    'categories' | 'carPhotos' | 'technicalPapers' | 'greenCard' | 'evidence' | 'insurance' | 'contracts'
  >('categories');
  const [activePhotoModal, setActivePhotoModal] = useState<'interior' | 'exterior' | 'mileage' | 'vin' | null>(null);
  const [activeTechnicalModal, setActiveTechnicalModal] = useState<'vtp' | 'mtp' | null>(null);
  const [showGreenCardModal, setShowGreenCardModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [uploadingPhotoKey, setUploadingPhotoKey] = useState<string | null>(null);
  const [mtpNumberDraft, setMtpNumberDraft] = useState('');
  const [savingMtpNumber, setSavingMtpNumber] = useState(false);
  const [insuranceEndsDraft, setInsuranceEndsDraft] = useState('');
  const [savingInsuranceEnds, setSavingInsuranceEnds] = useState(false);
  const [activeContractModal, setActiveContractModal] = useState<'buy' | 'rent' | null>(null);
  const [generatingContractKey, setGeneratingContractKey] = useState<'buy' | 'rent' | null>(null);

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

  const refreshLead = useCallback(async () => {
    if (!id) return;
    const leadRes = await axiosClient.get(`/leads/${id}`);
    const leadData: LeadResponse = leadRes.data;
    setLead(leadData);
    setForm(leadToForm(leadData));
  }, [id]);

  useEffect(() => {
    const value = (lead?.documents as any)?.insuranceEnds;
    setInsuranceEndsDraft(value ? String(value).split('T')[0] : '');
  }, [lead]);

  const downloadUrl = useCallback((documentFile: string) => {
    const base = (axiosClient.defaults.baseURL || '').replace(/\/$/, '');
    return `${base}/documents/download/${encodeURIComponent(documentFile)}`;
  }, []);

  const uploadLeadPhotos = useCallback(
    async (
      category: 'carInterior' | 'carExterior' | 'carMileage' | 'carVIN' | 'carVTP' | 'carMTP' | 'greenCard' | 'evidence',
      files: File[]
    ) => {
      if (!id) return;
      const onlyImages = files.filter((f) => f.type.startsWith('image/'));
      if (onlyImages.length === 0) return;

      setUploadingPhotoKey(category);
      try {
        for (const file of onlyImages) {
          const formData = new FormData();
          formData.append('document', file);
          formData.append('category', category);
          await axiosClient.post(`/leads/${id}/documents`, formData);
        }
        await refreshLead();
      } finally {
        setUploadingPhotoKey(null);
      }
    },
    [id, refreshLead]
  );

  const uploadInsuranceDocuments = useCallback(
    async (files: File[]) => {
      if (!id) return;
      if (!files || files.length === 0) return;

      setUploadingPhotoKey('insurance');
      try {
        for (const file of files) {
          const formData = new FormData();
          formData.append('document', file);
          formData.append('category', 'insurance');
          await axiosClient.post(`/leads/${id}/documents`, formData);
        }
        await refreshLead();
      } finally {
        setUploadingPhotoKey(null);
      }
    },
    [id, refreshLead]
  );

  const carPhotoConfigs = useMemo(
    () =>
      [
        {
          key: 'interior' as const,
          title: 'Interiér',
          subtitle: 'Nahrajte fotky interiéru',
          category: 'carInterior' as const,
          allowMultiple: true,
          existing: (lead?.documents?.carInterior || []) as LeadDocument[],
        },
        {
          key: 'exterior' as const,
          title: 'Exteriér',
          subtitle: 'Nahrajte fotky exteriéru',
          category: 'carExterior' as const,
          allowMultiple: true,
          existing: (lead?.documents?.carExterior || []) as LeadDocument[],
        },
        {
          key: 'mileage' as const,
          title: 'Tachometr',
          subtitle: 'Nahrajte fotku tachometru',
          category: 'carMileage' as const,
          allowMultiple: false,
          existing: lead?.documents?.carMileage ? [lead.documents.carMileage] : ([] as LeadDocument[]),
        },
        {
          key: 'vin' as const,
          title: 'VIN',
          subtitle: 'Nahrajte fotku VIN',
          category: 'carVIN' as const,
          allowMultiple: false,
          existing: lead?.documents?.carVIN ? [lead.documents.carVIN] : ([] as LeadDocument[]),
        },
      ] as const,
    [lead]
  );

  const technicalPaperConfigs = useMemo(
    () =>
      [
        {
          key: 'vtp' as const,
          title: 'TP původní',
          subtitle: 'Nahrajte fotky původního TP',
          category: 'carVTP' as const,
          allowMultiple: true,
          existing: (lead?.documents?.carVTP || []) as LeadDocument[],
        },
        {
          key: 'mtp' as const,
          title: 'TP nový přepsaný na Cash gate',
          subtitle: 'Nahrajte fotky nového TP',
          category: 'carMTP' as const,
          allowMultiple: true,
          existing: (lead?.documents?.carMTP || []) as LeadDocument[],
        },
      ] as const,
    [lead]
  );

  const hasAllCarPhotoCategories = useMemo(() => {
    const countDocsWithFile = (value: unknown): number => {
      if (Array.isArray(value)) {
        return value.filter((d) => d && typeof d === 'object' && typeof (d as any).file === 'string' && (d as any).file).length;
      }
      if (value && typeof value === 'object') {
        return typeof (value as any).file === 'string' && (value as any).file ? 1 : 0;
      }
      return 0;
    };

    const docs = lead?.documents;
    if (!docs) return false;

    return (
      countDocsWithFile(docs.carInterior) > 0 &&
      countDocsWithFile(docs.carExterior) > 0 &&
      countDocsWithFile(docs.carMileage) > 0 &&
      countDocsWithFile(docs.carVIN) > 0
    );
  }, [lead]);

  const activeCarPhotoConfig = useMemo(
    () => carPhotoConfigs.find((c) => c.key === activePhotoModal) || null,
    [carPhotoConfigs, activePhotoModal]
  );

  const activeTechnicalConfig = useMemo(
    () => technicalPaperConfigs.find((c) => c.key === activeTechnicalModal) || null,
    [technicalPaperConfigs, activeTechnicalModal]
  );

  useEffect(() => {
    if (showDocumentsModal) {
      setMtpNumberDraft(String((lead?.car as any)?.numberMTP || ''));
    }
  }, [showDocumentsModal, lead]);

  const saveMtpNumber = useCallback(async () => {
    if (!id) return;
    setSavingMtpNumber(true);
    try {
      await axiosClient.patch(`/leads/${id}`, { car: { numberMTP: mtpNumberDraft.trim() } });
      await refreshLead();
    } finally {
      setSavingMtpNumber(false);
    }
  }, [id, mtpNumberDraft, refreshLead]);

  const saveInsuranceEnds = useCallback(async () => {
    if (!id) return;
    setSavingInsuranceEnds(true);
    try {
      await axiosClient.patch(`/leads/${id}`, { documents: { insuranceEnds: toISODateOrUndefined(insuranceEndsDraft) } });
      await refreshLead();
    } finally {
      setSavingInsuranceEnds(false);
    }
  }, [id, insuranceEndsDraft, refreshLead]);

  const hasTechnicalPapersComplete = useMemo(() => {
    const docs = lead?.documents;
    const hasNumber = Boolean(String((lead?.car as any)?.numberMTP || '').trim());
    const vtpCount = Array.isArray(docs?.carVTP) ? docs!.carVTP.filter((d) => d && typeof d === 'object' && (d as any).file).length : 0;
    const mtpCount = Array.isArray(docs?.carMTP) ? docs!.carMTP.filter((d) => d && typeof d === 'object' && (d as any).file).length : 0;
    return hasNumber && (vtpCount > 0 || mtpCount > 0);
  }, [lead]);

  const hasGreenCard = useMemo(() => {
    const d = lead?.documents?.greenCard as any;
    return Boolean(d && typeof d === 'object' && typeof d.file === 'string' && d.file);
  }, [lead]);

  const hasEvidence = useMemo(() => {
    const items = (lead?.documents?.evidence || []) as any[];
    return Array.isArray(items) && items.some((d) => d && typeof d === 'object' && typeof d.file === 'string' && d.file);
  }, [lead]);

  const hasContracts = useMemo(() => {
    const buy = (lead?.documents?.buyAgreement || []) as any[];
    const rent = (lead?.documents?.rentAgreement || []) as any[];
    const hasFiles = (items: any[]) => Array.isArray(items) && items.some((d) => d && typeof d === 'object' && typeof d.file === 'string' && d.file);
    return hasFiles(buy) || hasFiles(rent);
  }, [lead]);

  const hasInsurance = useMemo(() => {
    const items = (lead?.documents?.insurance || []) as any[];
    return Array.isArray(items) && items.some((d) => d && typeof d === 'object' && typeof d.file === 'string' && d.file);
  }, [lead]);

  const isPdfDoc = useCallback((doc: LeadDocument): boolean => {
    const file = typeof doc?.file === 'string' ? doc.file : '';
    return file.toLowerCase().endsWith('.pdf');
  }, []);

  const isDocxDoc = useCallback((doc: LeadDocument): boolean => {
    const file = typeof doc?.file === 'string' ? doc.file : '';
    return file.toLowerCase().endsWith('.docx');
  }, []);

  const triggerDownload = useCallback((url: string, filename?: string) => {
    const a = document.createElement('a');
    a.href = url;
    if (filename) a.download = filename;
    a.rel = 'noopener noreferrer';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const uploadContractDocuments = useCallback(
    async (category: 'buyAgreement' | 'rentAgreement', files: File[]) => {
      if (!id) return;
      if (!files || files.length === 0) return;

      setUploadingPhotoKey(category);
      try {
        for (const file of files) {
          const formData = new FormData();
          formData.append('document', file);
          formData.append('category', category);
          await axiosClient.post(`/leads/${id}/documents`, formData);
        }
        await refreshLead();
      } finally {
        setUploadingPhotoKey(null);
      }
    },
    [id, refreshLead]
  );

  const generateBuyAgreementDocx = useCallback(async () => {
    if (!id) return;
    setGeneratingContractKey('buy');
    try {
      const res = await axiosClient.post(`/leads/${id}/generateBuyAgreementDocx`);
      const file = res?.data?.data?.file as string | undefined;
      if (file) {
        triggerDownload(downloadUrl(file), file);
      }
      await refreshLead();
    } finally {
      setGeneratingContractKey(null);
    }
  }, [id, refreshLead, triggerDownload]);

  const generateRentAgreementDocx = useCallback(async () => {
    if (!id) return;
    setGeneratingContractKey('rent');
    try {
      const res = await axiosClient.post(`/leads/${id}/generateRentAgreementDocx`);
      const file = res?.data?.data?.file as string | undefined;
      if (file) {
        triggerDownload(downloadUrl(file), file);
      }
      await refreshLead();
    } finally {
      setGeneratingContractKey(null);
    }
  }, [id, refreshLead, triggerDownload]);

  const ContractUploadModal = ({
    isOpen,
    onClose,
    title,
    category,
    existing,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    category: 'buyAgreement' | 'rentAgreement';
    existing: LeadDocument[];
  }) => {
    const uploadInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
      if (isOpen) {
        setDragActive(false);
      }
    }, [isOpen]);

    if (!isOpen) return null;

    const existingWithFile = (existing || []).filter((d) => typeof d?.file === 'string' && d.file);

    return (
      <>
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[92vh] overflow-y-auto mx-2 sm:mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Zavřít
              </button>
            </div>

            <div className="p-4">
              <div
                className={`border-2 border-dashed rounded-lg p-4 mb-4 transition-colors ${
                  dragActive ? 'border-red-600 bg-red-50' : 'border-gray-300'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const files = Array.from(e.dataTransfer.files || []);
                  await uploadContractDocuments(category, files);
                }}
              >
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/*,application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    e.target.value = '';
                    await uploadContractDocuments(category, files);
                  }}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    e.target.value = '';
                    await uploadContractDocuments(category, files);
                  }}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => uploadInputRef.current?.click()}
                    disabled={uploadingPhotoKey === category}
                    className="flex-1 w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-gray-700"
                  >
                    {uploadingPhotoKey === category ? 'Nahrávám...' : 'Nahrát (PDF/foto)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={uploadingPhotoKey === category}
                    className="flex-1 w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white"
                  >
                    Vyfotit
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-3">
                  {dragActive ? 'Pusťte soubory zde…' : 'nebo přetáhněte soubory sem (drag & drop)'}
                </p>
              </div>

              {existingWithFile.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {existingWithFile.map((doc, idx) => {
                    const url = downloadUrl(doc.file as string);
                    if (isPdfDoc(doc) || isDocxDoc(doc)) {
                      return (
                        <button
                          key={`${doc._id || doc.file || idx}`}
                          type="button"
                          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                          className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <span className="text-sm text-gray-800 truncate">{doc.name || doc.file}</span>
                          <span className="text-xs text-gray-500">{isDocxDoc(doc) ? 'DOCX' : 'PDF'}</span>
                        </button>
                      );
                    }

                    return (
                      <img
                        key={`${doc._id || doc.file || idx}`}
                        src={url}
                        alt={`${title} ${idx + 1}`}
                        className="w-full h-32 object-cover rounded border border-gray-200 cursor-pointer"
                        loading="lazy"
                        onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>Zatím žádné dokumenty</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="w-full py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
              >
                Hotovo
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

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
    return tryFormatDateTimePrague(value);
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
    const existingFile = (lead as any)?.documents?.carDetectReport?.file as string | undefined;

    const openPdfInBrowser = async (documentFile: string): Promise<'opened' | 'missing'> => {
      try {
        const resp = await axiosClient.get(`/documents/download/${encodeURIComponent(documentFile)}`, {
          responseType: 'blob',
        });
        const blob = resp.data instanceof Blob ? resp.data : new Blob([resp.data]);
        const url = window.URL.createObjectURL(blob);

        const opened = window.open(url, '_blank', 'noopener,noreferrer');
        if (!opened) {
          window.location.href = url;
        }

        window.setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 60_000);
        return 'opened';
      } catch (err) {
        console.error('Failed to open CarDetect PDF via blob:', err);

        const status = (err as any)?.response?.status as number | undefined;
        if (status === 404) {
          // The file reference exists on the lead, but the backend cannot find it on disk
          // (common after redeploy or when running multiple replicas without shared storage).
          return 'missing';
        }

        // Fallback: open download URL in a new tab (lets the browser handle the file).
        const base = (axiosClient.defaults.baseURL || '').replace(/\/$/, '');
        const url = `${base}/documents/download/${encodeURIComponent(documentFile)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        return 'opened';
      }
    };

    // If we already have a stored CarDetect PDF, just open it.
    if (typeof existingFile === 'string' && existingFile) {
      const result = await openPdfInBrowser(existingFile);
      if (result === 'opened') {
        return;
      }
    }

    // Otherwise generate it (and store to the lead).
    if (!form.vin.trim()) {
      alert('Vyplňte prosím VIN vozu.');
      return;
    }

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
        const result = await openPdfInBrowser(documentFile);
        if (result === 'missing') {
          alert('CarDetect report se nepodařilo stáhnout (soubor nebyl nalezen na serveru). Zkuste to prosím znovu.');
        }
      }
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
              const result = await openPdfInBrowser(documentFile);
              if (result === 'missing') {
                alert('CarDetect report se nepodařilo stáhnout (soubor nebyl nalezen na serveru). Zkuste to prosím znovu.');
              }
            }
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

  const setLeadCheck = async (field: 'carDetectReportOk' | 'executionOk', value: boolean) => {
    if (!id) return;
    setSavingLeadChecks(true);
    try {
      await axiosClient.patch(`/leads/${id}`, {
        [field]: value,
      });
      await refreshLead();
    } catch (e) {
      console.error('Failed to update lead check:', e);
      alert('Nepodařilo se uložit změnu');
    } finally {
      setSavingLeadChecks(false);
    }
  };

  const formatDealerName = (value: any): string => {
    if (!value) return '-';
    if (typeof value === 'string') return value;
    return value?.name || value?.user?.name || '-';
  };

  const handleOpenSubStatus = () => {
    setSubStatusDraft(String(lead?.subStatus || ''));
    setShowSubStatusPicker(true);
  };

  const handleConfirmSubStatus = async () => {
    if (!id) return;
    const next = subStatusDraft.trim();
    if (!next) return;

    try {
      setSettingSubStatus(true);
      await axiosClient.patch(`/leads/${id}`, { subStatus: next });
      await refreshLead();
      setShowSubStatusPicker(false);
    } catch (e) {
      console.error('Failed to update subStatus:', e);
      alert('Nepodařilo se nastavit substatus');
    } finally {
      setSettingSubStatus(false);
    }
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

            <button
              type="button"
              onClick={() => {
                setDocumentsView('categories');
                setActivePhotoModal(null);
                setShowDocumentsModal(true);
              }}
              className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Dokumenty
            </button>

            <button type="button" className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Fotogalerie
            </button>

            <div className="pt-2 border-t border-gray-200 space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={Boolean(lead?.carDetectReportOk)}
                  disabled={savingLeadChecks}
                  onChange={(e) => setLeadCheck('carDetectReportOk', e.target.checked)}
                />
                <span className="text-sm">CarDetect report OK</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={Boolean(lead?.executionOk)}
                  disabled={savingLeadChecks}
                  onChange={(e) => setLeadCheck('executionOk', e.target.checked)}
                />
                <span className="text-sm">Exekuce OK</span>
              </label>

              {savingLeadChecks && <div className="text-xs text-gray-500">Ukládám...</div>}
            </div>

            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500">Aktuální substatus</div>
              <div className="text-sm text-gray-800 mb-2">{normalizeSubstatus(lead?.subStatus)}</div>

              <div className="text-xs text-gray-500 mb-1">Historie substatusů</div>
              <div className="border border-gray-200 rounded-lg p-2 max-h-64 overflow-auto bg-gray-50">
                {lead?.subStatusHistory && lead.subStatusHistory.length > 0 ? (
                  <div className="space-y-2">
                    {lead.subStatusHistory
                      .slice()
                      .sort((a, b) => new Date(b.changedAt || 0).getTime() - new Date(a.changedAt || 0).getTime())
                      .map((item, idx) => (
                        <div
                          key={`${item.changedAt || idx}-${item.subStatus || idx}`}
                          className="bg-white border border-gray-200 rounded-md p-2"
                        >
                          <div className="text-xs text-gray-500 flex items-center justify-between gap-2">
                            <span>{formatDealerName(item.changedBy)}</span>
                            <span>{formatNoteDateTime(item.changedAt)}</span>
                          </div>
                          <div className="text-sm text-gray-800">{normalizeSubstatus(item.subStatus)}</div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Zatím bez změn substatusu</div>
                )}
              </div>
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
            {lead?.subStatus ? (
              <div>
                Substatus: <span className="font-medium">{normalizeSubstatus(lead.subStatus)}</span>
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
              onClick={handleOpenSubStatus}
              disabled={saving || settingDeclined || settingAmApproved}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 font-medium"
            >
              SubStatus update
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

        {showSubStatusPicker ? (
          <div className="mt-3 bg-white rounded-lg p-4 shadow border border-gray-200">
            <div className="text-sm font-medium text-gray-800 mb-2">Substatus</div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <select
                value={subStatusDraft}
                onChange={(e) => setSubStatusDraft(e.target.value)}
                className="w-full md:flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Vyberte substatus</option>
                {LEAD_SUBSTATES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubStatusPicker(false)}
                  disabled={settingSubStatus}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Zrušit
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubStatus}
                  disabled={settingSubStatus || !subStatusDraft.trim()}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {settingSubStatus ? 'Ukládám...' : 'Potvrdit'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

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

        {showDocumentsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowDocumentsModal(false)}
              role="button"
              tabIndex={-1}
            />
            <div
              className="relative w-full max-w-lg mx-2 sm:mx-4 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {documentsView !== 'categories' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDocumentsView('categories');
                        setActivePhotoModal(null);
                        setActiveTechnicalModal(null);
                        setShowGreenCardModal(false);
                        setShowEvidenceModal(false);
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                    >
                      Zpět
                    </button>
                  ) : null}
                  <div className="text-sm font-semibold text-gray-900">Dokumenty</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDocumentsModal(false)}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Zavřít
                </button>
              </div>

              <div className="p-4">
                {documentsView === 'categories' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'Fotografie auta',
                      'Evidenční kontrola',
                      'Technické průkazy',
                      'Smlouvy',
                      'Zelená karta',
                      'Plná moc',
                      'Pojištění',
                      'Při prodeji',
                      'CarDetect report',
                      'Ostatni dokumenty',
                    ].map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          if (label === 'Fotografie auta') {
                            setDocumentsView('carPhotos');
                          }
                          if (label === 'Evidenční kontrola') {
                            setDocumentsView('evidence');
                          }
                          if (label === 'Technické průkazy') {
                            setDocumentsView('technicalPapers');
                          }
                          if (label === 'Smlouvy') {
                            setDocumentsView('contracts');
                          }
                          if (label === 'Zelená karta') {
                            setDocumentsView('greenCard');
                          }
                          if (label === 'Pojištění') {
                            setDocumentsView('insurance');
                          }
                          if (label === 'CarDetect report') {
                            void handleGenerateCarDetectReport();
                          }
                        }}
                        className={`w-full px-3 py-3 text-sm text-white rounded-lg ${
                          label === 'Fotografie auta'
                            ? hasAllCarPhotoCategories
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-red-600 hover:bg-red-700'
                            : label === 'Evidenční kontrola'
                              ? hasEvidence
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-red-600 hover:bg-red-700'
                            : label === 'Technické průkazy'
                              ? hasTechnicalPapersComplete
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-red-600 hover:bg-red-700'
                              : label === 'Zelená karta'
                                ? hasGreenCard
                                  ? 'bg-green-600 hover:bg-green-700'
                                  : 'bg-red-600 hover:bg-red-700'
                                : label === 'Smlouvy'
                                  ? hasContracts
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-red-600 hover:bg-red-700'
                                : label === 'Pojištění'
                                  ? hasInsurance
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-red-600 hover:bg-red-700'
                              : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : documentsView === 'evidence' ? (
                  <>
                    <div className="text-sm font-medium text-gray-800 mb-3">Evidenční kontrola</div>

                    <div
                      onClick={() => setShowEvidenceModal(true)}
                      className={`border-2 border-dashed rounded-lg p-3 cursor-pointer hover:border-red-600 transition-colors min-h-[140px] ${
                        'border-gray-300 bg-gray-50'
                      }`}
                    >
                      {hasEvidence ? (
                        <div className="w-full">
                          <div className="grid grid-cols-2 gap-1 mb-2">
                            {((lead?.documents?.evidence || []) as LeadDocument[])
                              .filter((d) => typeof d?.file === 'string' && d.file)
                              .slice(0, 4)
                              .map((d, idx) => (
                                <img
                                  key={idx}
                                  src={downloadUrl(d.file as string)}
                                  alt={`Evidenční kontrola ${idx + 1}`}
                                  className="w-full h-12 object-cover rounded border border-gray-200"
                                  loading="lazy"
                                />
                              ))}
                          </div>
                          <p className="text-xs text-center text-gray-700">
                            {((lead?.documents?.evidence || []) as LeadDocument[]).filter(
                              (d) => typeof d?.file === 'string' && d.file
                            ).length}{' '}
                            {((lead?.documents?.evidence || []) as LeadDocument[]).filter(
                              (d) => typeof d?.file === 'string' && d.file
                            ).length === 1
                              ? 'fotografie'
                              : 'fotografií'}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowEvidenceModal(true);
                            }}
                            className="mt-2 w-full py-2 px-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm"
                          >
                            Zobrazit
                          </button>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                          <p className="text-sm font-medium text-gray-900">Evidenční kontrola</p>
                          <p className="text-xs text-gray-500">Nahrajte fotku evidenční kontroly</p>
                          <p className="text-[11px] text-gray-400 mt-2">Klikněte nebo přetáhněte fotku</p>
                        </div>
                      )}

                      {uploadingPhotoKey === 'evidence' ? (
                        <div className="mt-2 text-xs text-gray-600 text-center">Nahrávám...</div>
                      ) : null}
                    </div>

                    <PhotoUploadModal
                      isOpen={showEvidenceModal}
                      onClose={() => setShowEvidenceModal(false)}
                      title="Evidenční kontrola"
                      existing={((lead?.documents?.evidence || []) as LeadDocument[]) ?? ([] as LeadDocument[])}
                      allowMultiple={true}
                      uploading={uploadingPhotoKey === 'evidence'}
                      onUploadFiles={async (files) => {
                        await uploadLeadPhotos('evidence', files);
                      }}
                      downloadUrl={downloadUrl}
                    />
                  </>
                ) : documentsView === 'carPhotos' ? (
                  <>
                    <div className="text-sm font-medium text-gray-800 mb-3">Fotografie auta</div>

                    <div className="grid grid-cols-2 gap-3">
                      {carPhotoConfigs.map((item) => {
                        const existingFiles = (item.existing || []).filter((d) => typeof d?.file === 'string' && d.file);
                        const previews = existingFiles
                          .slice(0, 4)
                          .map((d) => downloadUrl(d.file as string));

                        return (
                          <div
                            key={item.key}
                            onClick={() => setActivePhotoModal(item.key)}
                            className={`border-2 border-dashed rounded-lg p-3 cursor-pointer hover:border-red-600 transition-colors min-h-[140px] ${
                              'border-gray-300 bg-gray-50'
                            }`}
                          >
                            {previews.length > 0 ? (
                              <div className="w-full">
                                <div className="grid grid-cols-2 gap-1 mb-2">
                                  {previews.map((src, idx) => (
                                    <img
                                      key={idx}
                                      src={src}
                                      alt={`${item.title} ${idx + 1}`}
                                      className="w-full h-12 object-cover rounded border border-gray-200"
                                      loading="lazy"
                                    />
                                  ))}
                                </div>
                                <p className="text-xs text-center text-gray-700">
                                  {existingFiles.length} {existingFiles.length === 1 ? 'fotografie' : 'fotografií'}
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActivePhotoModal(item.key);
                                  }}
                                  className="mt-2 w-full py-2 px-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm"
                                >
                                  Zobrazit
                                </button>
                              </div>
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center text-center">
                                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                <p className="text-xs text-gray-500">{item.subtitle}</p>
                                <p className="text-[11px] text-gray-400 mt-2">Klikněte nebo přetáhněte fotku</p>
                              </div>
                            )}

                            {uploadingPhotoKey === item.category ? (
                              <div className="mt-2 text-xs text-gray-600 text-center">Nahrávám...</div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    <PhotoUploadModal
                      isOpen={Boolean(activeCarPhotoConfig)}
                      onClose={() => setActivePhotoModal(null)}
                      title={activeCarPhotoConfig?.title || ''}
                      existing={(activeCarPhotoConfig?.existing || []) as LeadDocument[]}
                      allowMultiple={Boolean(activeCarPhotoConfig?.allowMultiple)}
                      uploading={
                        Boolean(activeCarPhotoConfig?.category) && uploadingPhotoKey === activeCarPhotoConfig?.category
                      }
                      onUploadFiles={async (files) => {
                        if (!activeCarPhotoConfig?.category) return;
                        await uploadLeadPhotos(activeCarPhotoConfig.category, files);
                      }}
                      downloadUrl={downloadUrl}
                    />
                  </>
                ) : documentsView === 'technicalPapers' ? (
                  <>
                    <div className="text-sm font-medium text-gray-800 mb-3">Technické průkazy</div>

                    <div className="mb-4 border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="text-sm font-medium text-gray-900 mb-2">Číslo MTP</div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          value={mtpNumberDraft}
                          onChange={(e) => setMtpNumberDraft(e.target.value)}
                          placeholder="Zadejte číslo MTP"
                          className="w-full flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => void saveMtpNumber()}
                          disabled={savingMtpNumber}
                          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                        >
                          {savingMtpNumber ? 'Ukládám…' : 'Uložit'}
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">Tlačítko „Technické průkazy“ zezelená, pokud je nahrán alespoň jeden TP a je uložené číslo MTP.</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {technicalPaperConfigs.map((item) => {
                        const existingFiles = (item.existing || []).filter((d) => typeof d?.file === 'string' && d.file);
                        const previews = existingFiles.slice(0, 4).map((d) => downloadUrl(d.file as string));

                        return (
                          <div
                            key={item.key}
                            onClick={() => setActiveTechnicalModal(item.key)}
                            className={`border-2 border-dashed rounded-lg p-3 cursor-pointer hover:border-red-600 transition-colors min-h-[140px] ${
                              'border-gray-300 bg-gray-50'
                            }`}
                          >
                            {previews.length > 0 ? (
                              <div className="w-full">
                                <div className="grid grid-cols-2 gap-1 mb-2">
                                  {previews.map((src, idx) => (
                                    <img
                                      key={idx}
                                      src={src}
                                      alt={`${item.title} ${idx + 1}`}
                                      className="w-full h-12 object-cover rounded border border-gray-200"
                                      loading="lazy"
                                    />
                                  ))}
                                </div>
                                <p className="text-xs text-center text-gray-700">
                                  {existingFiles.length} {existingFiles.length === 1 ? 'dokument' : 'dokumentů'}
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTechnicalModal(item.key);
                                  }}
                                  className="mt-2 w-full py-2 px-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm"
                                >
                                  Zobrazit
                                </button>
                              </div>
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center text-center">
                                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                <p className="text-xs text-gray-500">{item.subtitle}</p>
                                <p className="text-[11px] text-gray-400 mt-2">Klikněte nebo přetáhněte fotku</p>
                              </div>
                            )}

                            {uploadingPhotoKey === item.category ? (
                              <div className="mt-2 text-xs text-gray-600 text-center">Nahrávám...</div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    <PhotoUploadModal
                      isOpen={Boolean(activeTechnicalConfig)}
                      onClose={() => setActiveTechnicalModal(null)}
                      title={activeTechnicalConfig?.title || ''}
                      existing={(activeTechnicalConfig?.existing || []) as LeadDocument[]}
                      allowMultiple={Boolean(activeTechnicalConfig?.allowMultiple)}
                      uploading={
                        Boolean(activeTechnicalConfig?.category) && uploadingPhotoKey === activeTechnicalConfig?.category
                      }
                      onUploadFiles={async (files) => {
                        if (!activeTechnicalConfig?.category) return;
                        await uploadLeadPhotos(activeTechnicalConfig.category, files);
                      }}
                      downloadUrl={downloadUrl}
                    />
                  </>
                ) : documentsView === 'insurance' ? (
                  <>
                    <div className="text-sm font-medium text-gray-800 mb-3">Pojištění</div>

                    <div className="mb-4 border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <label className="block text-xs text-gray-600 mb-1">Platnost pojištění do</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="date"
                          value={insuranceEndsDraft}
                          onChange={(e) => setInsuranceEndsDraft(e.target.value)}
                          className="w-full flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => void saveInsuranceEnds()}
                          disabled={savingInsuranceEnds}
                          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                        >
                          {savingInsuranceEnds ? 'Ukládám…' : 'Uložit'}
                        </button>
                      </div>
                    </div>

                    <div
                      className={`border-2 border-dashed rounded-lg p-4 mb-4 transition-colors ${
                        uploadingPhotoKey === 'insurance' ? 'border-gray-300 bg-gray-50' : 'border-gray-300 bg-gray-50'
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        const files = Array.from(e.dataTransfer.files || []);
                        await uploadInsuranceDocuments(files);
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*,application/pdf,.pdf"
                        multiple
                        className="hidden"
                        id="insurance-upload"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          e.target.value = '';
                          await uploadInsuranceDocuments(files);
                        }}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        id="insurance-capture"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          e.target.value = '';
                          await uploadInsuranceDocuments(files);
                        }}
                      />

                      <div className="flex gap-2 justify-center">
                        <label
                          htmlFor="insurance-upload"
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer"
                        >
                          {uploadingPhotoKey === 'insurance' ? 'Nahrávám…' : 'Nahrát (PDF/foto)'}
                        </label>
                        <label
                          htmlFor="insurance-capture"
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
                        >
                          Vyfotit
                        </label>
                      </div>

                      <p className="text-xs text-gray-500 text-center mt-3">nebo přetáhněte soubory sem (PDF / fotky)</p>
                    </div>

                    {Array.isArray(lead?.documents?.insurance) && (lead?.documents?.insurance || []).length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {(lead?.documents?.insurance || [])
                          .filter((d) => typeof d?.file === 'string' && d.file)
                          .map((d, idx) => {
                            const url = downloadUrl(d.file as string);
                            if (isPdfDoc(d)) {
                              return (
                                <button
                                  key={`${d._id || d.file || idx}`}
                                  type="button"
                                  onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                  <span className="text-sm text-gray-800 truncate">{d.name || d.file}</span>
                                  <span className="text-xs text-gray-500">PDF</span>
                                </button>
                              );
                            }

                            return (
                              <img
                                key={`${d._id || d.file || idx}`}
                                src={url}
                                alt={`Pojištění ${idx + 1}`}
                                className="w-full h-32 object-cover rounded border border-gray-200 cursor-pointer"
                                loading="lazy"
                                onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                              />
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <p>Zatím žádné dokumenty</p>
                      </div>
                    )}
                  </>
                ) : documentsView === 'contracts' ? (
                  <>
                    <div className="text-sm font-medium text-gray-800 mb-3">Smlouvy</div>

                    <div className="grid grid-cols-2 gap-3">
                      <div
                        onClick={() => setActiveContractModal('buy')}
                        className={`border-2 border-dashed rounded-lg p-3 cursor-pointer hover:border-red-600 transition-colors min-h-[140px] ${
                          'border-gray-300 bg-gray-50'
                        }`}
                      >
                        {Array.isArray(lead?.documents?.buyAgreement) && (lead?.documents?.buyAgreement || []).some((d) => (d as any)?.file) ? (
                          <div className="w-full">
                            <p className="text-sm font-medium text-gray-900">Kupní smlouva</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {(lead?.documents?.buyAgreement || []).filter((d) => typeof (d as any)?.file === 'string' && (d as any).file).length} dokumentů
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveContractModal('buy');
                              }}
                              className="mt-3 w-full py-2 px-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm"
                            >
                              Zobrazit
                            </button>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center">
                            <p className="text-sm font-medium text-gray-900">Kupní smlouva</p>
                            <p className="text-xs text-gray-500">Nahrajte PDF nebo fotku</p>
                            <p className="text-[11px] text-gray-400 mt-2">Klikněte nebo přetáhněte soubor</p>
                          </div>
                        )}
                      </div>

                      <div
                        onClick={() => setActiveContractModal('rent')}
                        className={`border-2 border-dashed rounded-lg p-3 cursor-pointer hover:border-red-600 transition-colors min-h-[140px] ${
                          'border-gray-300 bg-gray-50'
                        }`}
                      >
                        {Array.isArray(lead?.documents?.rentAgreement) && (lead?.documents?.rentAgreement || []).some((d) => (d as any)?.file) ? (
                          <div className="w-full">
                            <p className="text-sm font-medium text-gray-900">Nájemní smlouva</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {(lead?.documents?.rentAgreement || []).filter((d) => typeof (d as any)?.file === 'string' && (d as any).file).length} dokumentů
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveContractModal('rent');
                              }}
                              className="mt-3 w-full py-2 px-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm"
                            >
                              Zobrazit
                            </button>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center">
                            <p className="text-sm font-medium text-gray-900">Nájemní smlouva</p>
                            <p className="text-xs text-gray-500">Nahrajte PDF nebo fotku</p>
                            <p className="text-[11px] text-gray-400 mt-2">Klikněte nebo přetáhněte soubor</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => void generateBuyAgreementDocx()}
                        disabled={generatingContractKey === 'buy'}
                        className="w-full py-2 px-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                      >
                        {generatingContractKey === 'buy' ? 'Generuji…' : 'Generovat kupní smlouvu (Word)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void generateRentAgreementDocx()}
                        disabled={generatingContractKey === 'rent'}
                        className="w-full py-2 px-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                      >
                        {generatingContractKey === 'rent' ? 'Generuji…' : 'Generovat nájemní smlouvu (Word)'}
                      </button>
                    </div>

                    <ContractUploadModal
                      isOpen={activeContractModal === 'buy'}
                      onClose={() => setActiveContractModal(null)}
                      title="Kupní smlouva"
                      category="buyAgreement"
                      existing={((lead?.documents?.buyAgreement || []) as LeadDocument[]) ?? ([] as LeadDocument[])}
                    />
                    <ContractUploadModal
                      isOpen={activeContractModal === 'rent'}
                      onClose={() => setActiveContractModal(null)}
                      title="Nájemní smlouva"
                      category="rentAgreement"
                      existing={((lead?.documents?.rentAgreement || []) as LeadDocument[]) ?? ([] as LeadDocument[])}
                    />
                  </>
                ) : (
                  <>
                    <div className="text-sm font-medium text-gray-800 mb-3">Zelená karta</div>

                    <div
                      onClick={() => setShowGreenCardModal(true)}
                      className={`border-2 border-dashed rounded-lg p-3 cursor-pointer hover:border-red-600 transition-colors min-h-[140px] ${
                        'border-gray-300 bg-gray-50'
                      }`}
                    >
                      {lead?.documents?.greenCard?.file ? (
                        <div className="w-full">
                          <img
                            src={downloadUrl(lead.documents.greenCard.file as string)}
                            alt="Zelená karta"
                            className="w-full h-32 object-cover rounded border border-gray-200"
                            loading="lazy"
                          />
                          <p className="text-xs text-center text-gray-700 mt-2">Nahráno</p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowGreenCardModal(true);
                            }}
                            className="mt-2 w-full py-2 px-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm"
                          >
                            Zobrazit
                          </button>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                          <p className="text-sm font-medium text-gray-900">Zelená karta</p>
                          <p className="text-xs text-gray-500">Nahrajte fotku zelené karty</p>
                          <p className="text-[11px] text-gray-400 mt-2">Klikněte nebo přetáhněte fotku</p>
                        </div>
                      )}
                      {uploadingPhotoKey === 'greenCard' ? (
                        <div className="mt-2 text-xs text-gray-600 text-center">Nahrávám...</div>
                      ) : null}
                    </div>

                    <PhotoUploadModal
                      isOpen={showGreenCardModal}
                      onClose={() => setShowGreenCardModal(false)}
                      title="Zelená karta"
                      existing={lead?.documents?.greenCard ? ([lead.documents.greenCard] as LeadDocument[]) : ([] as LeadDocument[])}
                      allowMultiple={false}
                      uploading={uploadingPhotoKey === 'greenCard'}
                      onUploadFiles={async (files) => {
                        await uploadLeadPhotos('greenCard', files);
                      }}
                      downloadUrl={downloadUrl}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
