import { useMemo, useState } from 'react';

const formatCzk = (value: number) =>
  new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0,
  }).format(value);

const parseNumber = (value: string): number => {
  const normalized = value.replace(/\s+/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
};

export const Calculator = () => {
  const [carPriceInput, setCarPriceInput] = useState('');
  const [monthsInput, setMonthsInput] = useState('');
  const [rentPercentInput, setRentPercentInput] = useState('');

  const { monthlyPayment, error } = useMemo(() => {
    const carPrice = parseNumber(carPriceInput);
    const months = parseNumber(monthsInput);
    const rentPercent = parseNumber(rentPercentInput);

    if (carPriceInput === '' && monthsInput === '' && rentPercentInput === '') {
      return { monthlyPayment: null as number | null, error: null as string | null };
    }

    if (!Number.isFinite(carPrice) || carPrice <= 0) {
      return { monthlyPayment: null, error: 'Zadejte cenu auta.' };
    }

    if (!Number.isFinite(months) || months <= 0) {
      return { monthlyPayment: null, error: 'Zadejte pocet mesicu.' };
    }

    if (!Number.isFinite(rentPercent) || rentPercent < 0) {
      return { monthlyPayment: null, error: 'Zadejte vysi najemneho v %.' };
    }

    // Simple interpretation: rentPercent is total rent over the whole period as % of car price.
    // Monthly payment = (carPrice * rentPercent/100) / months
    const totalRent = (carPrice * rentPercent) / 100;
    const monthly = totalRent / months;

    return { monthlyPayment: monthly, error: null };
  }, [carPriceInput, monthsInput, rentPercentInput]);

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Kalkulator splatek</h1>
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cena auta (CZK)</label>
            <input
              type="text"
              inputMode="decimal"
              value={carPriceInput}
              onChange={(e) => setCarPriceInput(e.target.value)}
              placeholder="napr. 350000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pocet mesicu</label>
            <input
              type="text"
              inputMode="numeric"
              value={monthsInput}
              onChange={(e) => setMonthsInput(e.target.value)}
              placeholder="napr. 36"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Najemne (%)</label>
            <input
              type="text"
              inputMode="decimal"
              value={rentPercentInput}
              onChange={(e) => setRentPercentInput(e.target.value)}
              placeholder="napr. 30"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="pt-2">
          {error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : monthlyPayment != null ? (
            <div className="text-lg font-semibold text-gray-900">
              Mesicni splatka: {formatCzk(monthlyPayment)}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Zadejte hodnoty pro vypocet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calculator;
