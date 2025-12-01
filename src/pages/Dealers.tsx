import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table } from '@/components';
import { axiosClient } from '@/api/axiosClient';

interface Dealer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dealerType: string;
  team?: string;
  isActive: boolean;
  createdAt: string;
}

interface DealersResponse {
  results: Dealer[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export function Dealers() {
  const navigate = useNavigate();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchDealers = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get<DealersResponse>('/dealers', {
          params: { page, limit: 20 }
        });
        setDealers(response.data.results.map(dealer => ({
          ...dealer,
          createdAt: new Date(dealer.createdAt).toLocaleDateString('cs-CZ'),
        })));
        setTotalPages(response.data.totalPages);
      } catch (err) {
        console.error('Failed to fetch dealers:', err);
        setError('Nepodařilo se načíst obchodníky');
      } finally {
        setLoading(false);
      }
    };

    fetchDealers();
  }, [page]);

  const columns = [
    { key: 'name' as const, header: 'Jméno' },
    { key: 'email' as const, header: 'E-mail' },
    { key: 'phone' as const, header: 'Telefon' },
    { key: 'dealerType' as const, header: 'Role' },
    { key: 'team' as const, header: 'Tým' },
    {
      key: 'isActive' as const,
      header: 'Stav',
      render: (dealer: Dealer) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            dealer.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {dealer.isActive ? 'Aktivní' : 'Neaktivní'}
        </span>
      ),
    },
    { key: 'createdAt' as const, header: 'Vytvořeno' },
  ];

  const handleRowClick = (dealer: Dealer) => {
    navigate(`/dealers/${dealer.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Obchodníci</h1>
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          + Přidat obchodníka
        </button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={dealers}
          onRowClick={handleRowClick}
          emptyMessage="Žádní obchodníci"
        />
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ←
            </button>
            <span className="px-4 py-2 bg-gray-100 rounded-full text-sm">
              Strana {page} z {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 px-3 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default Dealers;
