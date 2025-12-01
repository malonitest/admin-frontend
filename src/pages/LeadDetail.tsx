import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { axiosClient } from '@/api/axiosClient';

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
}

interface Dealer {
  id: string;
  user: {
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
    ozAddress: '',
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
          model: leadData.car?.model || '',
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
          ozAddress: 'Praha\n10000 Praha',
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
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50">
                  <HomeIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Ulice"
                  className="flex-1 px-3 py-2 focus:outline-none" 
                />
              </div>
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
              <input 
                type="text" 
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                placeholder="Značka auta"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" 
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Model auta</label>
              <input 
                type="text" 
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="Model auta"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" 
              />
            </div>
            <p className="text-red-500 text-sm">Zadejte model vozu</p>

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

            {/* Requested Amount */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Žádaná částka</label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50">
                  <BankIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  type="number" 
                  value={formData.requestedAmount}
                  onChange={(e) => handleInputChange('requestedAmount', e.target.value)}
                  placeholder="Žádaná částka"
                  className="flex-1 px-3 py-2 focus:outline-none" 
                />
              </div>
            </div>
            <p className="text-red-500 text-sm">Zadejte částku</p>

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

            {/* Decided At */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Datum rozhodnutí leadu</label>
              <input 
                type="text" 
                value={formatDate(lead.decidedAt)}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" 
              />
            </div>

            {/* Estimated Value */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Obvyklá cena z Cebia</label>
              <input 
                type="text" 
                value={lead.estimatedValue?.toLocaleString('cs-CZ') || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" 
              />
            </div>

            {/* Action Buttons */}
            <button className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Generovat nabídku
            </button>
            <button className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Cebia report
            </button>
            <button className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
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

            {/* Assigned OZ */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Přiřazení OZ</label>
              <select 
                value={formData.assignedOZ}
                onChange={(e) => handleInputChange('assignedOZ', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-blue-600 text-white"
              >
                <option value="">Vyberte OZ</option>
                {dealers.map((dealer, index) => (
                  <option key={dealer.id || `dealer-${index}`} value={dealer.id}>
                    {dealer.user?.name || 'Neznámý'}
                  </option>
                ))}
              </select>
            </div>

            {/* OZ Visit Date */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Datum návštevy OZ</label>
              <input 
                type="date" 
                value={formData.ozVisitDate}
                onChange={(e) => handleInputChange('ozVisitDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" 
              />
            </div>

            {/* OZ Address */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Adresa obchodního zástupce</label>
              <textarea 
                value={formData.ozAddress}
                onChange={(e) => handleInputChange('ozAddress', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none resize-none" 
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-4 flex justify-end">
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

export default LeadDetail;
