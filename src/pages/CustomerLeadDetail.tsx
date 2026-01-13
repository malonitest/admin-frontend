import { useEffect, useState, type ChangeEvent } from 'react';
import { meApi, PortalLead } from '@/api/meApi';

type ProfileForm = {
  name: string;
  phone: string;
  email: string;
  companyID: string;
  birthday: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  enableAddress2: boolean;
  address2: string;
  city2: string;
  postalCode2: string;
  country2: string;
};

const toDateInputValue = (value?: string) => {
  if (!value) return '';
  // If backend sends ISO date, keep YYYY-MM-DD part.
  if (value.includes('T')) return value.slice(0, 10);
  return value;
};

const isNonEmpty = (value?: string) => typeof value === 'string' && value.trim().length > 0;

const buildInitialForm = (lead: PortalLead): ProfileForm => {
  const c = lead.customer ?? {};
  const hasCorrespondenceFilled =
    isNonEmpty(c.address2) || isNonEmpty(c.city2) || isNonEmpty(c.postalCode2) || isNonEmpty(c.country2);
  const enableAddress2 = Boolean(c.enableAddress2) || hasCorrespondenceFilled;

  return {
    name: c.name ?? '',
    phone: c.phone ?? '',
    email: c.email ?? '',
    companyID: c.companyID ?? '',
    birthday: toDateInputValue(c.birthday),
    address: c.address ?? '',
    city: c.city ?? '',
    postalCode: c.postalCode ?? '',
    country: c.country ?? '',
    enableAddress2,
    address2: c.address2 ?? '',
    city2: c.city2 ?? '',
    postalCode2: c.postalCode2 ?? '',
    country2: c.country2 ?? '',
  };
};

export function CustomerLeadDetail() {
  const [lead, setLead] = useState<PortalLead | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string>('');
  const [form, setForm] = useState<ProfileForm | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const data = await meApi.getMyLead();
        setLead(data);
        setForm(buildInitialForm(data));
      } catch (e: any) {
        setError(e.response?.data?.message || 'Nepodařilo se načíst lead');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const updateField = (key: keyof ProfileForm) => (e: ChangeEvent<HTMLInputElement>) => {
    setSaved('');
    const next = e.target.value;
    setForm((prev) => (prev ? { ...prev, [key]: next } : prev));
  };

  const toggleCorrespondence = () => {
    setSaved('');
    setForm((prev) => {
      if (!prev) return prev;
      const nextEnabled = !prev.enableAddress2;
      if (!nextEnabled) {
        return {
          ...prev,
          enableAddress2: false,
          address2: '',
          city2: '',
          postalCode2: '',
          country2: '',
        };
      }
      return { ...prev, enableAddress2: true };
    });
  };

  const saveProfile = async () => {
    if (!form) return;
    try {
      setSaving(true);
      setError('');
      setSaved('');

      const updated = await meApi.updateMyProfile({
        name: form.name,
        email: form.email,
        companyID: form.companyID,
        birthday: form.birthday,
        address: form.address,
        city: form.city,
        postalCode: form.postalCode,
        country: form.country,
        enableAddress2: form.enableAddress2,
        address2: form.enableAddress2 ? form.address2 : '',
        city2: form.enableAddress2 ? form.city2 : '',
        postalCode2: form.enableAddress2 ? form.postalCode2 : '',
        country2: form.enableAddress2 ? form.country2 : '',
      });

      setLead(updated);
      setForm(buildInitialForm(updated));
      setSaved('Uloženo');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Nepodařilo se uložit změny');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-gray-600">Načítám…</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!lead) {
    return <div className="text-gray-600">Lead nebyl nalezen.</div>;
  }

  if (!form) {
    return <div className="text-gray-600">Načítám…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">Osobní informace</h1>
        <div className="flex items-center gap-3">
          {saved ? <div className="text-sm text-green-700">{saved}</div> : null}
          <button
            onClick={saveProfile}
            disabled={saving}
            className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Ukládám…' : 'Uložit'}
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <div className="text-sm text-gray-500">Stav</div>
        <div className="text-lg font-semibold">{lead.status || '-'}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm font-semibold text-gray-900 mb-2">Zákazník</div>
          <div className="grid grid-cols-1 gap-3">
            <label className="text-sm">
              <div className="text-gray-600 mb-1">Jméno a příjmení</div>
              <input
                value={form.name}
                onChange={updateField('name')}
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="Jméno"
              />
            </label>

            <label className="text-sm">
              <div className="text-gray-600 mb-1">Telefon</div>
              <input value={form.phone} disabled className="w-full border rounded-md px-3 py-2 text-sm bg-gray-50" />
              <div className="text-xs text-gray-500 mt-1">Telefon pro přihlášení zatím nelze změnit.</div>
            </label>

            <label className="text-sm">
              <div className="text-gray-600 mb-1">Email</div>
              <input
                value={form.email}
                onChange={updateField('email')}
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="Email"
              />
            </label>

            <label className="text-sm">
              <div className="text-gray-600 mb-1">IČO</div>
              <input
                value={form.companyID}
                onChange={updateField('companyID')}
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="IČO"
              />
            </label>

            <label className="text-sm">
              <div className="text-gray-600 mb-1">Datum narození</div>
              <input
                type="date"
                value={form.birthday}
                onChange={updateField('birthday')}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm font-semibold text-gray-900 mb-2">Vozidlo</div>
          <div className="text-sm text-gray-700">Značka: {lead.car?.brand || '-'}</div>
          <div className="text-sm text-gray-700">Model: {lead.car?.model || '-'}</div>
          <div className="text-sm text-gray-700">VIN: {lead.car?.VIN || '-'}</div>
          <div className="text-sm text-gray-700">Nájezd: {lead.car?.mileage ?? '-'} km</div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-4">
        <div className="text-sm font-semibold text-gray-900">Adresa</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm md:col-span-2">
            <div className="text-gray-600 mb-1">Ulice a číslo</div>
            <input value={form.address} onChange={updateField('address')} className="w-full border rounded-md px-3 py-2 text-sm" />
          </label>
          <label className="text-sm">
            <div className="text-gray-600 mb-1">Město</div>
            <input value={form.city} onChange={updateField('city')} className="w-full border rounded-md px-3 py-2 text-sm" />
          </label>
          <label className="text-sm">
            <div className="text-gray-600 mb-1">PSČ</div>
            <input value={form.postalCode} onChange={updateField('postalCode')} className="w-full border rounded-md px-3 py-2 text-sm" />
          </label>
          <label className="text-sm md:col-span-2">
            <div className="text-gray-600 mb-1">Země</div>
            <input value={form.country} onChange={updateField('country')} className="w-full border rounded-md px-3 py-2 text-sm" />
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm font-semibold text-gray-900">Korespondenční adresa</div>
          <button
            type="button"
            onClick={toggleCorrespondence}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              form.enableAddress2 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {form.enableAddress2 ? 'Aktivní' : 'Není'}
          </button>
        </div>

        {form.enableAddress2 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm md:col-span-2">
              <div className="text-gray-600 mb-1">Ulice a číslo</div>
              <input value={form.address2} onChange={updateField('address2')} className="w-full border rounded-md px-3 py-2 text-sm" />
            </label>
            <label className="text-sm">
              <div className="text-gray-600 mb-1">Město</div>
              <input value={form.city2} onChange={updateField('city2')} className="w-full border rounded-md px-3 py-2 text-sm" />
            </label>
            <label className="text-sm">
              <div className="text-gray-600 mb-1">PSČ</div>
              <input value={form.postalCode2} onChange={updateField('postalCode2')} className="w-full border rounded-md px-3 py-2 text-sm" />
            </label>
            <label className="text-sm md:col-span-2">
              <div className="text-gray-600 mb-1">Země</div>
              <input value={form.country2} onChange={updateField('country2')} className="w-full border rounded-md px-3 py-2 text-sm" />
            </label>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default CustomerLeadDetail;
