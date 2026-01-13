import { useEffect, useMemo, useState } from 'react';
import { meApi, PortalDocument, PortalLeadDocuments } from '@/api/meApi';
import axiosClient from '@/api/axiosClient';

const openDocument = async (file: string) => {
  const response = await axiosClient.get(`/me/documents/${encodeURIComponent(file)}`, {
    responseType: 'blob',
  });

  const contentType = (response.headers?.['content-type'] as string | undefined) || 'application/octet-stream';
  const blob = new Blob([response.data], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');

  // Let the browser load it, then cleanup soon after.
  window.setTimeout(() => window.URL.revokeObjectURL(url), 30_000);
};

const flatten = (docs: PortalLeadDocuments): Array<{ label: string; doc: PortalDocument }> => {
  const out: Array<{ label: string; doc: PortalDocument }> = [];
  const pushArr = (label: string, arr?: PortalDocument[]) => {
    (arr || []).forEach((d) => out.push({ label, doc: d }));
  };

  pushArr('Exteriér', docs.carExterior as PortalDocument[] | undefined);
  pushArr('Interiér', docs.carInterior as PortalDocument[] | undefined);
  pushArr('VTP', docs.carVTP as PortalDocument[] | undefined);
  pushArr('MTP', docs.carMTP as PortalDocument[] | undefined);

  if (docs.carVIN) out.push({ label: 'VIN', doc: docs.carVIN as PortalDocument });
  if (docs.carMileage) out.push({ label: 'Nájezd', doc: docs.carMileage as PortalDocument });

  return out;
};

export function CustomerGallery() {
  const [docs, setDocs] = useState<PortalLeadDocuments | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const data = await meApi.getMyGallery();
        setDocs(data);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Nepodařilo se načíst fotogalerii');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const items = useMemo(() => (docs ? flatten(docs) : []), [docs]);

  if (loading) return <div className="text-gray-600">Načítám…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Fotogalerie</h1>

      {!items.length ? (
        <div className="text-gray-600">Zatím nejsou nahrané žádné fotky/dokumenty.</div>
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
                className={`bg-white border rounded-lg p-3 text-left hover:shadow-sm ${file ? '' : 'opacity-60 cursor-not-allowed'}`}
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

export default CustomerGallery;
