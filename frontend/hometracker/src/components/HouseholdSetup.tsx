import React, { useState } from 'react';
import { Home, UserPlus, ArrowRight, Sparkles, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useCreateHousehold, useJoinHousehold } from '../hooks/useHouseholds';

interface HouseholdSetupProps {
  onSuccess: (id: number) => void;
}

export default function HouseholdSetup({ onSuccess }: HouseholdSetupProps) {
  const { t } = useTranslation();
  const [createData, setCreateData] = useState({ name: '', description: '', baseCurrency: 'HUF' });
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  const createMutation = useCreateHousehold();
  const joinMutation = useJoinHousehold();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const newHousehold = await createMutation.mutateAsync({ 
        name: createData.name, 
        description: createData.description, 
        baseCurrency: createData.baseCurrency 
      });
      onSuccess(newHousehold.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const joinedHousehold = await joinMutation.mutateAsync(joinCode);
      onSuccess(joinedHousehold.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[70vh] px-6 py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header Area */}
      <div className="text-center mb-16">
        <div className="mb-6 inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Home size={32} />
        </div>
        <h1 className="text-5xl font-black tracking-tight text-neutral-100 mb-4">
          {t('household.setup.title')}
        </h1>
        <p className="text-xl text-neutral-500 max-w-2xl mx-auto">
          {t('household.setup.description')}
        </p>
      </div>

      {error && (
        <div className="w-full max-w-2xl mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-center font-medium animate-in zoom-in-95">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 w-full items-stretch">
        {/* Create Household Card */}
        <Card className="flex flex-col p-10 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-neutral-800 opacity-20 group-hover:opacity-40 transition-opacity">
            <Sparkles size={120} />
          </div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <LayoutGrid size={24} />
              </div>
              <h2 className="text-2xl font-bold text-neutral-100">{t('household.setup.create.title')}</h2>
            </div>

            <form onSubmit={handleCreate} className="space-y-6 flex-1 flex flex-col">
              <div className="space-y-4">
                <Input
                  label={t('household.setup.create.nameLabel')}
                  required
                  value={createData.name}
                  onChange={(e) => setCreateData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('household.setup.create.namePlaceholder')}
                />

                <Input
                  label={t('household.setup.create.descLabel')}
                  value={createData.description}
                  onChange={(e) => setCreateData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('household.setup.create.descPlaceholder')}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest ml-1">{t('household.setup.create.currencyLabel')}</label>
                  <select
                    value={createData.baseCurrency}
                    onChange={(e) => setCreateData(prev => ({ ...prev, baseCurrency: e.target.value }))}
                    className="w-full px-5 py-3.5 bg-neutral-950/50 border border-neutral-800 rounded-2xl text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all appearance-none"
                  >
                    <option value="HUF">{t('household.currencies.HUF')}</option>
                    <option value="EUR">{t('household.currencies.EUR')}</option>
                    <option value="USD">{t('household.currencies.USD')}</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                isLoading={createMutation.isPending}
                disabled={!createData.name}
                variant={!createData.name ? 'neutral' : 'primary'}
                className="w-full py-4 text-lg mt-auto"
              >
                {t('household.setup.create.submit')}
              </Button>
            </form>
          </div>
        </Card>

        {/* Join Household Card */}
        <Card className="flex flex-col p-10 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-neutral-800 opacity-20 group-hover:opacity-40 transition-opacity">
            <UserPlus size={120} />
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                <UserPlus size={24} />
              </div>
              <h2 className="text-2xl font-bold text-neutral-100">{t('household.setup.join.title')}</h2>
            </div>

            <p className="text-neutral-400 mb-8 leading-relaxed">
              {t('household.setup.join.description')}
            </p>

            <form onSubmit={handleJoin} className="space-y-6 flex-1 flex flex-col justify-center">
              <Input
                label={t('household.setup.join.codeLabel')}
                required
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX"
                className="text-center text-3xl font-mono tracking-widest text-emerald-400 placeholder-neutral-800"
              />

              <Button
                type="submit"
                isLoading={joinMutation.isPending}
                disabled={!joinCode}
                variant={!joinCode ? 'neutral' : 'secondary'}
                className="w-full py-4 text-lg mt-auto"
                icon={<ArrowRight className="ml-2 order-last" size={20} />}
              >
                {t('household.setup.join.submit')}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
