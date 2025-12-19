import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosClient } from '@/api/axiosClient';
import type { AxiosError } from 'axios';

interface PhotoItem {
  file: File;
  preview: string;
}

const MAX_PHOTOS = 5;

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 3v4H7V3M7 21v-8h10v8" />
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

function CarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function MoneyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  );
}

function PhotoUploadModal({
  isOpen,
  onClose,
  title,
  photos,
  onAddPhotos,
  onRemovePhoto,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  photos: PhotoItem[];
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (index: number) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onAddPhotos(files.slice(0, MAX_PHOTOS - photos.length));
    e.target.value = '';
  };

  const canAddMore = photos.length < MAX_PHOTOS;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[92vh] overflow-y-auto mx-2 sm:mx-4">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!canAddMore}
                className="flex-1 w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2 text-gray-700"
              >
                <FolderIcon className="w-5 h-5" />
                <span>Nahrát z počítače</span>
              </button>
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={!canAddMore}
                className="flex-1 w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2 text-white"
              >
                <CameraIcon className="w-5 h-5" />
                <span>Vyfotit</span>
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-3">
              Nahráno {photos.length} z {MAX_PHOTOS} fotografií
            </p>

            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img src={photo.preview} alt={`Foto ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                    <button
                      onClick={() => onRemovePhoto(index)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <UploadIcon className="w-12 h-12 mx-auto mb-2" />
                <p>Zatím žádné fotografie</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t">
            <button onClick={onClose} className="w-full py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
              Hotovo
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function NewLeadV2() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [isCompany, setIsCompany] = useState(false);
  const [companyID, setCompanyID] = useState('');
  const [companyName, setCompanyName] = useState('');

  const [noteMessage, setNoteMessage] = useState('');

  const [vin, setVin] = useState('');
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');

  const [interiorPhotos, setInteriorPhotos] = useState<PhotoItem[]>([]);
  const [exteriorPhotos, setExteriorPhotos] = useState<PhotoItem[]>([]);
  const [odometerPhotos, setOdometerPhotos] = useState<PhotoItem[]>([]);
  const [vinPhotos, setVinPhotos] = useState<PhotoItem[]>([]);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const [errors, setErrors] = useState<{ customerName?: string; phone?: string }>({});

  const handleAddPhotos = (files: File[], setter: React.Dispatch<React.SetStateAction<PhotoItem[]>>) => {
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter((prev) => (prev.length >= MAX_PHOTOS ? prev : [...prev, { file, preview: reader.result as string }]));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number, setter: React.Dispatch<React.SetStateAction<PhotoItem[]>>) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const nextErrors: { customerName?: string; phone?: string } = {};
    if (!customerName.trim()) nextErrors.customerName = 'Jméno je povinné';
    if (!phone.trim()) nextErrors.phone = 'Telefon je povinný';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Přihlášení vypršelo. Přihlaste se prosím znovu.');
      navigate('/login');
      return;
    }

    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        customer: {
          customerType: isCompany ? 'COMPANY' : 'INDIVIDUAL',
          name: customerName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: street.trim() || undefined,
          city: city.trim() || undefined,
          postalCode: postalCode.trim() || undefined,
          companyID: isCompany ? companyID.trim() || undefined : undefined,
          companyName: isCompany ? companyName.trim() || undefined : undefined,
        },
        car: {
          VIN: vin.trim() ? vin.trim().toUpperCase() : undefined,
          brand: carBrand.trim() || undefined,
          model: carModel.trim() || undefined,
          registration: carYear ? parseInt(carYear) : undefined,
          mileage: mileage ? parseInt(mileage) : undefined,
        },
        lease: {
          leaseAmount: requestedAmount ? parseInt(requestedAmount) : undefined,
        },
        noteMessage: noteMessage.trim() || undefined,
      };

      const response = await axiosClient.post('/leads/createBasic', payload);
      const leadId: string | undefined = response.data?.data?.id || response.data?.data?._id;
      if (!leadId) throw new Error('Missing lead id in response');

      for (const { photos, documentType } of [
        // Must match backend DocumentType enum values (see apps/backend/src/modules/document/document.types.ts)
        { photos: interiorPhotos, documentType: 'PHOTO_INTERIOR' },
        { photos: exteriorPhotos, documentType: 'PHOTO_EXTERIOR' },
        { photos: odometerPhotos, documentType: 'MILEAGE' },
        { photos: vinPhotos, documentType: 'VIN' },
      ]) {
        for (const photo of photos) {
          const formData = new FormData();
          formData.append('file', photo.file);
          formData.append('documentType', documentType);
          formData.append('leadId', leadId);
          await axiosClient.post(`/documents/upload`, formData);
        }
      }

      navigate('/leads');
    } catch (err) {
      console.error('Failed to create lead:', err);

      const maybeAxiosError = err as AxiosError<any>;
      const status = maybeAxiosError?.response?.status;
      if (status === 401) {
        alert('Přihlášení vypršelo. Přihlaste se prosím znovu.');
        navigate('/login');
        return;
      }

      alert('Nepodařilo se vytvořit lead');
    } finally {
      setSaving(false);
    }
  };

  const PhotoUploadBox = ({
    title,
    subtitle,
    photos,
    modalKey,
  }: {
    title: string;
    subtitle: string;
    photos: PhotoItem[];
    modalKey: string;
  }) => (
    <div
      onClick={() => setActiveModal(modalKey)}
      className="border-2 border-dashed border-gray-400 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-gray-800 transition-colors min-h-[140px] bg-gray-700"
    >
      {photos.length > 0 ? (
        <div className="w-full">
          <div className="grid grid-cols-2 gap-1 mb-2">
            {photos.slice(0, 4).map((photo, idx) => (
              <img key={idx} src={photo.preview} alt={`${title} ${idx + 1}`} className="w-full h-12 object-cover rounded" />
            ))}
          </div>
          <p className="text-xs text-center text-white">{photos.length} fotografií</p>
        </div>
      ) : (
        <>
          <UploadIcon className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm font-medium text-white text-center">{title}</p>
          <p className="text-xs text-gray-400 text-center">{subtitle}</p>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-700">
      <div className="bg-red-600 text-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/leads')} className="p-1 hover:bg-red-700 rounded">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">Nový lead</h1>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="mb-3">
              <div
                className={`flex items-center border rounded-lg overflow-hidden ${
                  errors.customerName ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <div className="px-3 py-2 bg-gray-50">
                  <PersonIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: undefined }));
                  }}
                  placeholder="Jméno klienta *"
                  className="flex-1 px-3 py-2 focus:outline-none"
                />
              </div>
              {errors.customerName && <p className="text-xs text-red-600 mt-1">{errors.customerName}</p>}
            </div>

            <div className="mb-3">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50">
                  <EmailIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail"
                  className="flex-1 px-3 py-2 focus:outline-none"
                />
              </div>
            </div>

            <div className="mb-3">
              <div
                className={`flex items-center border rounded-lg overflow-hidden ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
              >
                <div className="px-3 py-2 bg-gray-50">
                  <PhoneIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="Telefon *"
                  className="flex-1 px-3 py-2 focus:outline-none"
                />
              </div>
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </div>

            <div className="mb-3">
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Ulice"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="mb-3">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Město"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="PSČ"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-gray-700">Firemní klient</span>
              <input
                type="checkbox"
                checked={isCompany}
                onChange={(e) => setIsCompany(e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
            </div>

            {isCompany && (
              <>
                <div className="mb-3">
                  <input
                    type="text"
                    value={companyID}
                    onChange={(e) => setCompanyID(e.target.value)}
                    placeholder="IČO"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div className="mb-4">
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Název firmy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </>
            )}

            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Poznámka</label>
              <textarea
                value={noteMessage}
                onChange={(e) => setNoteMessage(e.target.value)}
                rows={4}
                placeholder="Zadejte poznámku..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <SaveIcon className="w-5 h-5" />
              {saving ? 'Ukládám...' : 'Uložit'}
            </button>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="mb-3">
              <input
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                placeholder="VIN vozu"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
              />
            </div>

            <div className="mb-3">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                <div className="px-3 py-2 bg-gray-50">
                  <CarIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={carBrand}
                  onChange={(e) => setCarBrand(e.target.value)}
                  placeholder="Značka vozu"
                  className="flex-1 px-3 py-2 focus:outline-none"
                />
              </div>
            </div>

            <div className="mb-3">
              <input
                type="text"
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
                placeholder="Model vozu"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
              />
            </div>

            <div className="mb-3">
              <input
                type="number"
                value={carYear}
                onChange={(e) => setCarYear(e.target.value)}
                placeholder="Rok výroby vozu"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
              />
            </div>

            <div className="mb-3">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                <div className="px-3 py-2 bg-gray-50">
                  <GridIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="Nájezd vozidla (km)"
                  className="flex-1 px-3 py-2 focus:outline-none"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                <div className="px-3 py-2 bg-gray-50">
                  <MoneyIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  placeholder="Požadovaná částka"
                  className="flex-1 px-3 py-2 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3">
              <PhotoUploadBox title="Interiér vozidla" subtitle="Nahrajte fotky interiéru" photos={interiorPhotos} modalKey="interior" />
              <PhotoUploadBox title="Exteriér vozidla" subtitle="Nahrajte fotky exteriéru" photos={exteriorPhotos} modalKey="exterior" />
              <PhotoUploadBox title="Tachometr" subtitle="Nahrajte fotky tachometru" photos={odometerPhotos} modalKey="odometer" />
              <PhotoUploadBox title="VIN číslo vozidla" subtitle="Nahrajte fotky VIN" photos={vinPhotos} modalKey="vin" />
            </div>
          </div>
        </div>
      </div>

      <PhotoUploadModal
        isOpen={activeModal === 'interior'}
        onClose={() => setActiveModal(null)}
        title="Interiér vozidla"
        photos={interiorPhotos}
        onAddPhotos={(files) => handleAddPhotos(files, setInteriorPhotos)}
        onRemovePhoto={(index) => handleRemovePhoto(index, setInteriorPhotos)}
      />
      <PhotoUploadModal
        isOpen={activeModal === 'exterior'}
        onClose={() => setActiveModal(null)}
        title="Exteriér vozidla"
        photos={exteriorPhotos}
        onAddPhotos={(files) => handleAddPhotos(files, setExteriorPhotos)}
        onRemovePhoto={(index) => handleRemovePhoto(index, setExteriorPhotos)}
      />
      <PhotoUploadModal
        isOpen={activeModal === 'odometer'}
        onClose={() => setActiveModal(null)}
        title="Tachometr"
        photos={odometerPhotos}
        onAddPhotos={(files) => handleAddPhotos(files, setOdometerPhotos)}
        onRemovePhoto={(index) => handleRemovePhoto(index, setOdometerPhotos)}
      />
      <PhotoUploadModal
        isOpen={activeModal === 'vin'}
        onClose={() => setActiveModal(null)}
        title="VIN číslo vozidla"
        photos={vinPhotos}
        onAddPhotos={(files) => handleAddPhotos(files, setVinPhotos)}
        onRemovePhoto={(index) => handleRemovePhoto(index, setVinPhotos)}
      />
    </div>
  );
}

export default NewLeadV2;
