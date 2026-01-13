import { useEffect, useMemo, useState } from 'react';
import axiosClient from '@/api/axiosClient';
import { meApi, PortalDocument, PortalLead } from '@/api/meApi';

type Section = 'agreements' | 'technical' | 'insurance';

type DocItem = {
  label: string;
  doc: PortalDocument;
};

const openDocument = async (file: string) => {
  const response = await axiosClient.get(`/me/documents/${encodeURIComponent(file)}`, {
    responseType: 'blob',
  });

  const contentType = (response.headers?.['content-type'] as string | undefined) || 'application/octet-stream';
  const blob = new Blob([response.data], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');

  window.setTimeout(() => window.URL.revokeObjectURL(url), 30_000);
};

const collectDocs = (lead: PortalLead | null): Record<Section, DocItem[]> => {
  const docs: any = lead?.documents ?? {};

  const pushArr = (out: DocItem[], label: string, arr?: PortalDocument[]) => {
    (arr || []).forEach((d) => out.push({ label, doc: d }));
  };

  const pushOne = (out: DocItem[], label: string, doc?: PortalDocument) => {
    if (doc) out.push({ label, doc });
  };

  const agreements: DocItem[] = [];
  pushArr(agreements, 'Kupní smlouva', docs.buyAgreement as PortalDocument[] | undefined);
  pushArr(agreements, 'Nájemní smlouva', docs.rentAgreement as PortalDocument[] | undefined);
  pushArr(agreements, 'Plná moc', docs.powerOfAttorney as PortalDocument[] | undefined);
  pushArr(agreements, 'Kupní plná moc', docs.buyMandate as PortalDocument[] | undefined);
  pushArr(agreements, 'Prodejní plná moc', docs.sellMandate as PortalDocument[] | undefined);
  pushArr(agreements, 'Při prodeji', docs.sell as PortalDocument[] | undefined);

  const technical: DocItem[] = [];
  pushArr(technical, 'VTP', docs.carVTP as PortalDocument[] | undefined);
  pushArr(technical, 'MTP', docs.carMTP as PortalDocument[] | undefined);
  pushOne(technical, 'VIN', docs.carVIN as PortalDocument | undefined);
  pushOne(technical, 'Nájezd', docs.carMileage as PortalDocument | undefined);

  const insurance: DocItem[] = [];
  pushArr(insurance, 'Pojištění', docs.insurance as PortalDocument[] | undefined);
  pushOne(insurance, 'Zelená karta', docs.greenCard as PortalDocument | undefined);

  return { agreements, technical, insurance };
};

const navButtonClass = (active: boolean) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    active ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50'
  }`;

export function CustomerContracts() {
  const [lead, setLead] = useState<PortalLead | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>('agreements');

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const data = await meApi.getMyLead();
        setLead(data);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Nepodařilo se načíst dokumenty');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const docsBySection = useMemo(() => collectDocs(lead), [lead]);
  const items = docsBySection[section] || [];

  if (loading) return <div className="text-gray-600">Načítám…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Smlouvy</h1>

      <div className="flex gap-2 flex-wrap">
        <button type="button" className={navButtonClass(section === 'agreements')} onClick={() => setSection('agreements')}>
          Smlouvy
        </button>
        <button type="button" className={navButtonClass(section === 'technical')} onClick={() => setSection('technical')}>
          Technické průkazy
        </button>
        <button type="button" className={navButtonClass(section === 'insurance')} onClick={() => setSection('insurance')}>
          Pojištění
        </button>
      </div>

      {!items.length ? (
        <div className="text-gray-600">Zatím nejsou nahrané žádné dokumenty v této kategorii.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((it, idx) => {
            const file = it.doc.file;
            return (
              <button
                key={`${it.label}-${idx}`}
                type="button"
                onClick={() => file && openDocument(file)}
                disabled={!file}
                className={`bg-white border rounded-lg p-3 text-left hover:shadow-sm ${
                  file ? '' : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="text-xs text-gray-500">{it.label}</div>
                <div className="text-sm font-medium text-gray-900 break-all">{it.doc.file || it.doc.id || it.doc._id || '-'}</div>
                <div className="text-xs text-blue-600 mt-2">Otevřít</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CustomerContracts;
