import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { axiosClient } from '@/api/axiosClient';
import { SearchableSelect } from '@/components/SearchableSelect';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { getBrandNames, getModelsForBrand } from '@/data/carBrands';

interface INote {
  message: string;
  author?: string | null;
  createdAt: string;
}

interface Lead {
  id: string;
  uniqueId: number;
  product: string;
  source: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  decidedAt?: string;
  salesVisitAt?: string;
  customer: {
    customerType?: string;
    name: string;
    email?: string;
    phone: string;
    address?: string;
    city?: string;
    postalCode?: string;
    bankAccount?: string;
    idNumber?: string;
    birthNumber?: string;
    birthday?: string;
    companyID?: string;
    companyName?: string;
    enableAddress2?: boolean;
    address2?: string;
    city2?: string;
    postalCode2?: string;
  };
  car?: {
    brand?: string;
    model?: string;
    registration?: number;
    VIN?: string;
    mileage?: number;
    carSPZ?: string;
    mileagePhoto?: string;
    vinPhoto?: string;
  };
  lease?: {
    offer?: number;
    rentDuration?: number;
    leaseAmount?: number;
    monthlyPayment?: number;
    yearlyInsuranceFee?: number;
    payoutInCash?: boolean;
    payoutInCashAmount?: number;
    yearlyInterestRate?: number;
    adminFee?: number;
  };
  estimatedValue?: number;
  note?: INote[];
  dealer?: { name?: string; id?: string } | string;
  assignedSalesManager?: { name?: string; id?: string } | string;
  supervisor?: { name?: string; id?: string } | string;
  documents?: {
    carVIN?: { _id: string; file: string };
    carMileage?: { _id: string; file: string };
    carExterior?: { _id: string; file: string }[];
    carInterior?: { _id: string; file: string }[];
  };
}

interface Dealer {
  id: string;
  name?: string;
  user?: {
    name: string;
  };
}

const PRODUCT_TYPES: Record<string, string> = {
  'ZPETNY_PRONAJEM': 'Zpětný Pronájem',
  'ZPETNY_LEASING': 'Zpětný Leasing',
  'FINANCOVANI': 'Financování',
};

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function HashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
    </svg>
  );
}

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function BankIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
    </svg>
  );
}

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('cs-CZ') + ' ' + date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

function formatDateOnly(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('cs-CZ');
}

export function LeadDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [saving, setSaving] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedDocCategory, setSelectedDocCategory] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [isDragging, setIsDragging] = useState<string | null>(null); // Track which drop zone is active

  // Document category to documentType mapping according to backend API
  const getDocumentType = (category: string): string => {
    const mapping: Record<string, string> = {
      'najezd_vin': 'carVIN', // nebo 'carMileage' - použije se podle specifického uploadu
      'evidencni_kontrola': 'carVTP',
      'technicke_prukazy': 'carMTP',
      'fyzicka_kontrola': 'carExterior', // nebo 'carInterior'
      'smlouvy': 'buyAgreement', // nebo 'rentAgreement'
      'zelena_karta': 'greenCard',
      'plna_moc': 'buyMandate', // nebo 'sellMandate'
      'pri_prodeji': 'sellMandate',
      'pojisteni': 'insurance',
      'ostatni': 'other',
      'cebia_cardetect': 'carDetectReport',
    };
    return mapping[category] || 'other';
  };

  // Drag & drop handler with automatic fallback to /uploadDocument
  const handleDrop = async (e: React.DragEvent, documentType: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(null);
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    setUploadingDoc(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);
        formData.append('leadId', id!);
        
        // Try new endpoint first, fallback to original if 404
        try {
          await axiosClient.post(`/documents/upload`, formData);
        } catch (error: any) {
          if (error.response?.status === 404) {
            console.warn('⚠️ /upload returned 404, trying fallback /uploadDocument...');
            await axiosClient.post(`/documents/uploadDocument`, formData);
          } else {
            throw error;
          }
        }
      }
      await refreshLead();
      alert(`${files.length > 1 ? 'Dokumenty byly' : 'Dokument byl'} úspěšně nahrán`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Chyba při nahrávání');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDragOver = (e: React.DragEvent, zone: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(zone);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(null);
  };

  // Refresh lead data after document upload
  const refreshLead = async () => {
    try {
      const res = await axiosClient.get(`/leads/${id}`);
      setLead(res.data);
    } catch (error) {
      console.error('Failed to refresh lead:', error);
    }
  };

  // Form states
  const [formData, setFormData] = useState({
    // Customer
    customerName: '',
    email: '',
    phone: '',
    birthday: '',
    birthNumber: '',
    address: '',
    city: '',
    postalCode: '',
    enableAddress2: false,
    salesVisitAt: '',
    // Car
    vin: '',
    brand: '',
    model: '',
    customerModel: '',
    registration: '',
    carSPZ: '',
    mileage: '',
    requestedAmount: '',
    // Lease
    bankAccount: '',
    rentDuration: '',
    monthlyPayment: '',
    yearlyInsuranceFee: '',
    payoutInCash: false,
    adminFee: '',
    monthlyRent: '',
    // Assignment
    assignedOZ: '',
    ozVisitDate: '',
    ozVisitTime: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadRes, dealersRes] = await Promise.all([
          axiosClient.get(`/leads/${id}`),
          axiosClient.get('/dealers?limit=100'),
        ]);
        const leadData = leadRes.data;
        setLead(leadData);
        setDealers(dealersRes.data.results || []);

        // Populate form data
        setFormData({
          customerName: leadData.customer?.name || '',
          email: leadData.customer?.email || '',
          phone: leadData.customer?.phone || '',
          birthday: leadData.customer?.birthday ? leadData.customer.birthday.split('T')[0] : '',
          birthNumber: leadData.customer?.birthNumber || '',
          address: leadData.customer?.address || '',
          city: leadData.customer?.city || '',
          postalCode: leadData.customer?.postalCode || '',
          enableAddress2: leadData.customer?.enableAddress2 || false,
          salesVisitAt: leadData.salesVisitAt ? leadData.salesVisitAt.split('T')[0] : '',
          vin: leadData.car?.VIN || '',
          brand: leadData.car?.brand || '',
          model: '',
          customerModel: leadData.car?.model || '',
          registration: leadData.car?.registration?.toString() || '',
          carSPZ: leadData.car?.carSPZ || '',
          mileage: leadData.car?.mileage?.toString() || '',
          requestedAmount: leadData.lease?.leaseAmount?.toString() || '',
          bankAccount: leadData.customer?.bankAccount || '',
          rentDuration: leadData.lease?.rentDuration?.toString() || '',
          monthlyPayment: leadData.lease?.monthlyPayment?.toString() || '',
          yearlyInsuranceFee: leadData.lease?.yearlyInsuranceFee?.toString() || '',
          payoutInCash: leadData.lease?.payoutInCash || false,
          adminFee: leadData.lease?.adminFee?.toString() || '5000',
          monthlyRent: '',
          assignedOZ: typeof leadData.assignedSalesManager === 'object' ? leadData.assignedSalesManager?.id : leadData.assignedSalesManager || '',
          ozVisitDate: '',
          ozVisitTime: '',
        });
      } catch (err) {
        console.error('Failed to fetch lead:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosClient.patch(`/leads/${id}`, {
        customer: {
          name: formData.customerName,
          email: formData.email,
          phone: formData.phone,
          birthday: formData.birthday || undefined,
          birthNumber: formData.birthNumber || undefined,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          enableAddress2: formData.enableAddress2,
          bankAccount: formData.bankAccount,
        },
        car: {
          VIN: formData.vin,
          brand: formData.brand,
          model: formData.model,
          registration: formData.registration ? parseInt(formData.registration) : undefined,
          carSPZ: formData.carSPZ,
          mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
        },
        lease: {
          leaseAmount: formData.requestedAmount ? parseInt(formData.requestedAmount) : undefined,
          rentDuration: formData.rentDuration ? parseInt(formData.rentDuration) : undefined,
          monthlyPayment: formData.monthlyPayment ? parseInt(formData.monthlyPayment) : undefined,
          yearlyInsuranceFee: formData.yearlyInsuranceFee ? parseInt(formData.yearlyInsuranceFee) : undefined,
          payoutInCash: formData.payoutInCash,
          adminFee: formData.adminFee ? parseInt(formData.adminFee) : undefined,
        },
        assignedSalesManager: formData.assignedOZ || undefined,
        salesVisitAt: formData.salesVisitAt || undefined,
      });
      alert('Uloženo');
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Nepodařilo se uložit');
    } finally {
      setSaving(false);
    }
  };

  const latestNote = lead?.note && lead.note.length > 0 
    ? lead.note[lead.note.length - 1] 
    : null;

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
      {/* Header */}
      <div className="bg-red-600 text-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/leads')} className="p-1 hover:bg-red-700 rounded">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">Konverze leadu - schváleno</h1>
      </div>

      {/* Content - 4 columns */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          
          {/* Column 1 - Customer Info */}
          <div className="bg-white rounded-lg p-4 shadow space-y-3">
            {/* ID */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">ID</label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50">
                  <HashIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  value={lead.uniqueId} 
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 text-gray-600" 
                />
              </div>
            </div>

            {/* Product Type */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Typ produktu</label>
              <select 
                value={lead.product}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled
              >
                {Object.entries(PRODUCT_TYPES).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Jméno a příjmení zákazníka</label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50">
                  <PersonIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  className="flex-1 px-3 py-2 focus:outline-none" 
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">E-mail zákazníka</label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50">
                  <EmailIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="flex-1 px-3 py-2 focus:outline-none" 
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Telefon zákazníka</label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50">
                  <PhoneIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="flex-1 px-3 py-2 focus:outline-none" 
                />
              </div>
            </div>

            {/* Birthday */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Datum narození zákazníka</label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50">
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  type="date" 
                  value={formData.birthday}
                  onChange={(e) => handleInputChange('birthday', e.target.value)}
                  placeholder="Datum narození zákazníka"
                  className="flex-1 px-3 py-2 focus:outline-none" 
                />
              </div>
            </div>

            {/* Birth Number */}
            <div>
              <div className="px-3 py-2 bg-gray-200 rounded-lg text-gray-600">
                Rodné číslo zákazníka
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ulice</label>
              <AddressAutocomplete
                value={formData.address}
                onChange={(value) => handleInputChange('address', value)}
                onAddressSelect={(addr) => {
                  handleInputChange('address', addr.street);
                  handleInputChange('city', addr.city);
                  handleInputChange('postalCode', addr.postalCode);
                }}
                placeholder="Zadejte adresu..."
                icon={<HomeIcon className="w-5 h-5 text-gray-400" />}
              />
            </div>

            {/* City */}
            <div>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50">
                  <HomeIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Město"
                  className="flex-1 px-3 py-2 focus:outline-none" 
                />
              </div>
            </div>

            {/* Postal Code */}
            <div>
              <input 
                type="text" 
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                placeholder="PSČ"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" 
              />
            </div>

            {/* Correspondence Address Checkbox */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Přidat korespondenční adresu</span>
              <input 
                type="checkbox"
                checked={formData.enableAddress2}
                onChange={(e) => handleInputChange('enableAddress2', e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded"
              />
            </div>


          </div>

          {/* Column 2 - Car Info */}
          <div className="bg-white rounded-lg p-4 shadow space-y-3">
            {/* VIN */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">VIN číslo auta</label>
              <input 
                type="text" 
                value={formData.vin}
                onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
                placeholder="VIN číslo auta"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" 
              />
            </div>
            <p className="text-red-500 text-sm">Zadejte VIN vozu</p>

            {/* Brand */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Značka auta</label>
              <SearchableSelect
                value={formData.brand}
                onChange={(value) => {
                  handleInputChange('brand', value);
                  // Reset model when brand changes
                  handleInputChange('model', '');
                }}
                options={getBrandNames()}
                placeholder="Vyberte značku"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Model auta</label>
              <SearchableSelect
                value={formData.model}
                onChange={(value) => handleInputChange('model', value)}
                options={formData.brand ? getModelsForBrand(formData.brand) : []}
                placeholder={formData.brand ? "Vyberte model" : "Nejprve vyberte značku"}
                disabled={!formData.brand}
              />
            </div>

            {/* Customer Model */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Model zadaný zákazníkem</label>
              <input 
                type="text" 
                value={formData.customerModel}
                onChange={(e) => handleInputChange('customerModel', e.target.value)}
                placeholder="Model zadaný zákazníkem"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none bg-gray-50" 
                readOnly
              />
            </div>

            {/* Year */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rok výroby auta</label>
              <input 
                type="number" 
                value={formData.registration}
                onChange={(e) => handleInputChange('registration', e.target.value)}
                placeholder="Rok výroby auta"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" 
              />
            </div>

            {/* SPZ */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">SPZ</label>
              <input 
                type="text" 
                value={formData.carSPZ}
                onChange={(e) => handleInputChange('carSPZ', e.target.value.toUpperCase())}
                placeholder="SPZ"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" 
              />
            </div>
            <p className="text-red-500 text-sm">Zadejte SPZ vozidla</p>

            {/* Mileage */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nájezd vozidla (km)</label>
              <input 
                type="number" 
                value={formData.mileage}
                onChange={(e) => handleInputChange('mileage', e.target.value)}
                placeholder="Nájezd vozidla (km)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" 
              />
            </div>



            {/* Latest Note */}
            <div className="text-sm">
              <p className="font-medium">Nejnovější poznámka:</p>
              {latestNote ? (
                <p className="text-gray-600">
                  {formatDateOnly(latestNote.createdAt)}, {latestNote.message}
                </p>
              ) : (
                <p className="text-gray-400">Žádné poznámky</p>
              )}
            </div>

            {/* Notes Button */}
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
              <NoteIcon className="w-4 h-4" />
              Zobrazit všechny poznámky
            </button>
          </div>

          {/* Column 3 - Lead Status & Actions */}
          <div className="bg-white rounded-lg p-4 shadow space-y-3">
            {/* Source */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Zdroj leadu</label>
              <input 
                type="text" 
                value={lead.source || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" 
              />
            </div>

            {/* Created At */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Datum přijetí leadu</label>
              <input 
                type="text" 
                value={formatDate(lead.createdAt)}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" 
              />
            </div>

            {/* Last Updated At */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Datum poslední úpravy leadu</label>
              <input 
                type="text" 
                value={formatDate(lead.updatedAt)}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" 
              />
            </div>

            {/* Market Value */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tržní cena auta</label>
              <input 
                type="text" 
                value={lead.estimatedValue?.toLocaleString('cs-CZ') || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" 
              />
            </div>

            {/* Requested Amount - moved from column 2 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Žádaná částka</label>
              <input 
                type="number" 
                value={formData.requestedAmount}
                onChange={(e) => handleInputChange('requestedAmount', e.target.value)}
                placeholder="Žádaná částka"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" 
              />
            </div>

            {/* Action Buttons */}
            <button className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Generovat nabídku
            </button>
            <button className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              CarDetect report
            </button>
            <button 
              onClick={() => setShowDocumentsModal(true)}
              className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Dokumenty
            </button>
            <button className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Fotky vozidla
            </button>
          </div>

          {/* Column 4 - Lease Info */}
          <div className="bg-white rounded-lg p-4 shadow space-y-3">
            {/* Bank Account */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Číslo bankovního účtu</label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50">
                  <BankIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  value={formData.bankAccount}
                  onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                  placeholder="Číslo bankovního účtu"
                  className="flex-1 px-3 py-2 focus:outline-none" 
                />
              </div>
            </div>
            <p className="text-red-500 text-sm">Zadejte číslo bankovního účtu</p>

            {/* Rent Duration */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Délka smlouvy</label>
              <input 
                type="text" 
                value={formData.rentDuration}
                onChange={(e) => handleInputChange('rentDuration', e.target.value)}
                placeholder="Délka smlouvy"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" 
              />
            </div>
            <p className="text-red-500 text-sm">Zadejte počet měsíců</p>

            {/* Monthly Payment */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Měsíční nájemné (Kč)</label>
              <input 
                type="number" 
                value={formData.monthlyPayment}
                onChange={(e) => handleInputChange('monthlyPayment', e.target.value)}
                placeholder="Měsíční nájemné"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" 
              />
            </div>

            {/* Yearly Interest Rate */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Výše nájemného (%)</label>
              <input 
                type="text" 
                placeholder="Výše nájemného (%)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" 
              />
            </div>

            {/* Yearly Insurance */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Částka ročního pojištění (Kč)</label>
              <input 
                type="number" 
                value={formData.yearlyInsuranceFee}
                onChange={(e) => handleInputChange('yearlyInsuranceFee', e.target.value)}
                placeholder="Částka ročního pojištění"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" 
              />
            </div>
            <p className="text-red-500 text-sm">Zadejte částku ročního pojištění</p>

            {/* Payout in Cash */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Vyplacení v hotovosti</span>
              <input 
                type="checkbox"
                checked={formData.payoutInCash}
                onChange={(e) => handleInputChange('payoutInCash', e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded"
              />
            </div>

            {/* Admin Fee */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Výše poplatku (Kč)</label>
              <input 
                type="number" 
                value={formData.adminFee}
                onChange={(e) => handleInputChange('adminFee', e.target.value)}
                placeholder="Výše poplatku"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" 
              />
            </div>

            {/* Monthly Rent Total */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Celkový měsíční nájem (CZK)</label>
              <input 
                type="text" 
                placeholder="Celkový měsíční nájem"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" 
              />
            </div>

            {/* Assigned Technician */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Přiřazení technika</label>
              <select 
                value={formData.assignedOZ}
                onChange={(e) => handleInputChange('assignedOZ', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-blue-600 text-white"
              >
                <option value="">Vyberte technika</option>
                {dealers
                  .filter((dealer) => {
                    const name = dealer.name || dealer.user?.name || '';
                    return name.includes('Martin Dyntar') || name.includes('Michael Dyntar');
                  })
                  .map((dealer, index) => (
                    <option key={dealer.id || `dealer-${index}`} value={dealer.id}>
                      {dealer.name || dealer.user?.name || 'Neznámý'}
                    </option>
                  ))}
              </select>
            </div>

            {/* Technician Visit Date */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Datum návštěvy technika</label>
              <input 
                type="date" 
                value={formData.ozVisitDate}
                onChange={(e) => handleInputChange('ozVisitDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" 
              />
            </div>

            {/* Technician Visit Time */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Čas návštěvy technika</label>
              <input 
                type="time" 
                value={formData.ozVisitTime}
                onChange={(e) => handleInputChange('ozVisitTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" 
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex justify-end gap-3">
          <button 
            onClick={() => {/* TODO: Handle decline */}}
            className="px-8 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
          >
            Zamítnout
          </button>
          <button 
            onClick={() => {/* TODO: Handle assign to technician */}}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Předat technikovi
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

      {/* Documents Modal */}
      {showDocumentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {!selectedDocCategory ? (
              <>
                <h2 className="text-xl font-bold text-center mb-6">Dokumenty</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedDocCategory('najezd_vin')}
                    className="py-3 px-4 bg-red-600 text-white rounded-full hover:bg-red-700 text-sm font-medium"
                  >
                    Nájezd a VIN
                  </button>
                  <button
                    onClick={() => setSelectedDocCategory('evidencni_kontrola')}
                    className="py-3 px-4 bg-red-600 text-white rounded-full hover:bg-red-700 text-sm font-medium"
                  >
                    Evidenční kontrola
                  </button>
                  <button
                    onClick={() => setSelectedDocCategory('technicke_prukazy')}
                    className="py-3 px-4 bg-red-600 text-white rounded-full hover:bg-red-700 text-sm font-medium"
                  >
                    Technické průkazy
                  </button>
                  <button
                    onClick={() => setSelectedDocCategory('fyzicka_kontrola')}
                    className="py-3 px-4 bg-red-600 text-white rounded-full hover:bg-red-700 text-sm font-medium"
                  >
                    Fyzická kontrola
                  </button>
                  <button
                    onClick={() => setSelectedDocCategory('smlouvy')}
                    className="py-3 px-4 bg-red-600 text-white rounded-full hover:bg-red-700 text-sm font-medium"
                  >
                    Smlouvy
                  </button>
                  <button
                    onClick={() => setSelectedDocCategory('zelena_karta')}
                    className="py-3 px-4 bg-red-600 text-white rounded-full hover:bg-red-700 text-sm font-medium"
                  >
                    Zelená karta
                  </button>
                  <button
                    onClick={() => setSelectedDocCategory('plna_moc')}
                    className="py-3 px-4 bg-red-600 text-white rounded-full hover:bg-red-700 text-sm font-medium"
                  >
                    Plná moc
                  </button>
                  <button
                    onClick={() => setSelectedDocCategory('pri_prodeji')}
                    className="py-3 px-4 bg-red-600 text-white rounded-full hover:bg-red-700 text-sm font-medium"
                  >
                    Při prodeji
                  </button>
                  <button
                    onClick={() => setSelectedDocCategory('pojisteni')}
                    className="py-3 px-4 bg-red-600 text-white rounded-full hover:bg-red-700 text-sm font-medium"
                  >
                    Pojištění
                  </button>
                  <button
                    onClick={() => setSelectedDocCategory('ostatni')}
                    className="py-3 px-4 bg-red-600 text-white rounded-full hover:bg-red-700 text-sm font-medium"
                  >
                    Ostatní dokumenty
                  </button>
                  <button
                    onClick={() => setSelectedDocCategory('cebia_cardetect')}
                    className="py-3 px-4 bg-red-600 text-white rounded-full hover:bg-red-700 text-sm font-medium col-span-1"
                  >
                    Cebia a CarDetect
                  </button>
                </div>
                <button
                  onClick={() => setShowDocumentsModal(false)}
                  className="mt-6 w-full py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700"
                >
                  Zavřít
                </button>
              </>
            ) : selectedDocCategory === 'najezd_vin' ? (
              <>
                <h2 className="text-xl font-bold text-center text-blue-500 mb-6">Nájezd a VIN</h2>
                
                {/* Fotka palubní desky */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-4 mb-4 transition-colors ${isDragging === 'mileage' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  onDrop={(e) => handleDrop(e, 'carMileage')}
                  onDragOver={(e) => handleDragOver(e, 'mileage')}
                  onDragLeave={handleDragLeave}
                >
                  <p className="text-center text-blue-500 font-medium mb-3">Fotka palubní desky</p>
                  
                  {/* Hidden inputs for upload and capture */}
                  <input
                    type="file"
                    id="doc-mileage-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingDoc(true);
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('documentType', 'carMileage');
                        formData.append('leadId', id!);
                        await axiosClient.post(`/documents/upload`, formData);
                        await refreshLead();
                        alert('Fotka palubní desky nahrána');
                      } catch (error) {
                        console.error('Upload error:', error);
                        alert('Chyba při nahrávání');
                      } finally {
                        setUploadingDoc(false);
                        e.target.value = '';
                      }
                    }}
                  />
                  <input
                    type="file"
                    id="doc-mileage-capture"
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingDoc(true);
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('documentType', 'carMileage');
                        formData.append('leadId', id!);
                        await axiosClient.post(`/documents/upload`, formData);
                        await refreshLead();
                        alert('Fotka palubní desky nahrána');
                      } catch (error) {
                        console.error('Upload error:', error);
                        alert('Chyba při nahrávání');
                      } finally {
                        setUploadingDoc(false);
                        e.target.value = '';
                      }
                    }}
                  />

                  {/* Preview area */}
                  <div className="flex justify-center mb-3">
                    {lead?.documents?.carMileage?.file ? (
                      <img 
                        src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/documents/download/${lead.documents.carMileage.file}`} 
                        alt="Palubní deska" 
                        className="w-32 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-32 h-20 bg-gray-800 rounded flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Three buttons */}
                  <div className="flex gap-2 justify-center">
                    <label 
                      htmlFor="doc-mileage-upload" 
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 cursor-pointer"
                    >
                      {uploadingDoc ? 'Nahrávám...' : 'Nahrát'}
                    </label>
                    <label 
                      htmlFor="doc-mileage-capture" 
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-full hover:bg-green-700 cursor-pointer"
                    >
                      Vyfotit
                    </label>
                    <button 
                      onClick={() => {
                        const choice = window.confirm('Klikněte OK pro nahrání souboru nebo Cancel pro vyfocení');
                        if (choice) {
                          document.getElementById('doc-mileage-upload')?.click();
                        } else {
                          document.getElementById('doc-mileage-capture')?.click();
                        }
                      }}
                      className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-full hover:bg-gray-700"
                    >
                      Přidat
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    {isDragging === 'mileage' ? '📁 Pusťte soubor zde...' : 'nebo přetáhněte soubor sem'}
                  </p>
                </div>

                {/* Fotka VIN */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-4 mb-4 transition-colors ${isDragging === 'vin' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  onDrop={(e) => handleDrop(e, 'carVIN')}
                  onDragOver={(e) => handleDragOver(e, 'vin')}
                  onDragLeave={handleDragLeave}
                >
                  <p className="text-center text-blue-500 font-medium mb-3">Fotka VIN</p>
                  
                  {/* Hidden inputs for upload and capture */}
                  <input
                    type="file"
                    id="doc-vin-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingDoc(true);
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('documentType', 'carVIN');
                        formData.append('leadId', id!);
                        await axiosClient.post(`/documents/upload`, formData);
                        await refreshLead();
                        alert('Fotka VIN nahrána');
                      } catch (error) {
                        console.error('Upload error:', error);
                        alert('Chyba při nahrávání');
                      } finally {
                        setUploadingDoc(false);
                        e.target.value = '';
                      }
                    }}
                  />
                  <input
                    type="file"
                    id="doc-vin-capture"
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingDoc(true);
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('documentType', 'carVIN');
                        formData.append('leadId', id!);
                        await axiosClient.post(`/documents/upload`, formData);
                        await refreshLead();
                        alert('Fotka VIN nahrána');
                      } catch (error) {
                        console.error('Upload error:', error);
                        alert('Chyba při nahrávání');
                      } finally {
                        setUploadingDoc(false);
                        e.target.value = '';
                      }
                    }}
                  />

                  {/* Preview area */}
                  <div className="flex justify-center mb-3">
                    {lead?.documents?.carVIN?.file ? (
                      <img 
                        src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'}/documents/download/${lead.documents.carVIN.file}`} 
                        alt="VIN" 
                        className="w-32 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-32 h-20 bg-gray-800 rounded flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Three buttons */}
                  <div className="flex gap-2 justify-center">
                    <label 
                      htmlFor="doc-vin-upload" 
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 cursor-pointer"
                    >
                      {uploadingDoc ? 'Nahrávám...' : 'Nahrát'}
                    </label>
                    <label 
                      htmlFor="doc-vin-capture" 
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-full hover:bg-green-700 cursor-pointer"
                    >
                      Vyfotit
                    </label>
                    <button 
                      onClick={() => {
                        const choice = window.confirm('Klikněte OK pro nahrání souboru nebo Cancel pro vyfocení');
                        if (choice) {
                          document.getElementById('doc-vin-upload')?.click();
                        } else {
                          document.getElementById('doc-vin-capture')?.click();
                        }
                      }}
                      className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-full hover:bg-gray-700"
                    >
                      Přidat
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    {isDragging === 'vin' ? '📁 Pusťte soubor zde...' : 'nebo přetáhněte soubor sem'}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedDocCategory(null)}
                  className="w-full py-2 bg-red-600 text-white rounded-full hover:bg-red-700 mb-2"
                >
                  Potvrdit
                </button>
                <button
                  onClick={() => setShowDocumentsModal(false)}
                  className="w-full py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700"
                >
                  Zavřít
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setSelectedDocCategory(null)}
                    className="mr-3 text-gray-600 hover:text-gray-800"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h2 className="text-xl font-bold text-blue-500">
                    {selectedDocCategory === 'evidencni_kontrola' && 'Evidenční kontrola'}
                    {selectedDocCategory === 'technicke_prukazy' && 'Technické průkazy'}
                    {selectedDocCategory === 'fyzicka_kontrola' && 'Fyzická kontrola'}
                    {selectedDocCategory === 'smlouvy' && 'Smlouvy'}
                    {selectedDocCategory === 'zelena_karta' && 'Zelená karta'}
                    {selectedDocCategory === 'plna_moc' && 'Plná moc'}
                    {selectedDocCategory === 'pri_prodeji' && 'Při prodeji'}
                    {selectedDocCategory === 'pojisteni' && 'Pojištění'}
                    {selectedDocCategory === 'ostatni' && 'Ostatní dokumenty'}
                    {selectedDocCategory === 'cebia_cardetect' && 'Cebia a CarDetect'}
                  </h2>
                </div>

                {/* Upload Area */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 mb-4 transition-colors ${isDragging === 'general' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  onDrop={(e) => handleDrop(e, selectedDocCategory || '')}
                  onDragOver={(e) => handleDragOver(e, 'general')}
                  onDragLeave={handleDragLeave}
                >
                  {/* Hidden inputs */}
                  <input
                    type="file"
                    id="doc-upload"
                    className="hidden"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      
                      setUploadingDoc(true);
                      try {
                        const documentType = getDocumentType(selectedDocCategory || '');
                        for (const file of Array.from(files)) {
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('documentType', documentType);
                          formData.append('leadId', id!);
                          
                          await axiosClient.post(`/documents/upload`, formData);
                        }
                        await refreshLead();
                        alert('Dokumenty byly úspěšně nahrány');
                      } catch (error) {
                        console.error('Upload error:', error);
                        alert('Chyba při nahrávání dokumentů');
                      } finally {
                        setUploadingDoc(false);
                        e.target.value = '';
                      }
                    }}
                  />
                  <input
                    type="file"
                    id="doc-capture"
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      setUploadingDoc(true);
                      try {
                        const documentType = getDocumentType(selectedDocCategory || '');
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('documentType', documentType);
                        formData.append('leadId', id!);
                        
                        await axiosClient.post(`/documents/upload`, formData);
                        await refreshLead();
                        alert('Dokument byl úspěšně nahrán');
                      } catch (error) {
                        console.error('Upload error:', error);
                        alert('Chyba při nahrávání dokumentu');
                      } finally {
                        setUploadingDoc(false);
                        e.target.value = '';
                      }
                    }}
                  />

                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-16 bg-gray-800 rounded flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                  </div>

                  {/* Three buttons */}
                  <div className="flex gap-2 justify-center mb-2">
                    <label 
                      htmlFor="doc-upload" 
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 cursor-pointer"
                    >
                      {uploadingDoc ? 'Nahrávám...' : 'Nahrát'}
                    </label>
                    <label 
                      htmlFor="doc-capture" 
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-full hover:bg-green-700 cursor-pointer"
                    >
                      Vyfotit
                    </label>
                    <button 
                      onClick={() => {
                        const choice = window.confirm('Klikněte OK pro nahrání souboru nebo Cancel pro vyfocení');
                        if (choice) {
                          document.getElementById('doc-upload')?.click();
                        } else {
                          document.getElementById('doc-capture')?.click();
                        }
                      }}
                      className="px-4 py-2 bg-gray-600 text-white text-sm rounded-full hover:bg-gray-700"
                    >
                      Přidat
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 text-center">
                    {isDragging === 'general' ? '📁 Pusťte soubory zde...' : 'PDF, DOC, DOCX, obrázky • nebo přetáhněte soubory sem'}
                  </p>
                </div>

                {/* Uploaded Documents List - placeholder */}
                <div className="text-sm text-gray-500 text-center py-4">
                  Zatím žádné dokumenty v této kategorii
                </div>

                <button
                  onClick={() => setSelectedDocCategory(null)}
                  className="mt-4 w-full py-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  Potvrdit
                </button>
                <button
                  onClick={() => setShowDocumentsModal(false)}
                  className="mt-2 w-full py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700"
                >
                  Zavřít
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LeadDetail;
