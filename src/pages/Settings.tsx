import { useState } from 'react';
import { useTranslation } from '@/hooks';
import { Card, Button, Input } from '@/components';

export function Settings() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    companyName: 'Car Back-Rent s.r.o.',
    email: 'info@carbackrent.cz',
    phone: '+420 800 123 456',
    address: 'Praha 1, Hlavní 100',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock save
    alert('Nastavení uloženo (mock)');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t('settings.title')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings navigation */}
        <Card>
          <nav className="space-y-1">
            <a
              href="#general"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-blue-50 text-blue-600"
            >
              {t('settings.general')}
            </a>
            <a
              href="#notifications"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100"
            >
              {t('settings.notifications')}
            </a>
            <a
              href="#security"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100"
            >
              {t('settings.security')}
            </a>
          </nav>
        </Card>

        {/* Settings form */}
        <div className="lg:col-span-2">
          <Card title={t('settings.general')}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Název společnosti"
                value={formData.companyName}
                onChange={handleChange('companyName')}
              />
              <Input
                label="E-mail"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
              />
              <Input
                label="Telefon"
                value={formData.phone}
                onChange={handleChange('phone')}
              />
              <Input
                label="Adresa"
                value={formData.address}
                onChange={handleChange('address')}
              />
              <div className="pt-4">
                <Button type="submit">
                  {t('settings.saveChanges')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Settings;
