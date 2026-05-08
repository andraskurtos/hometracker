import React, { useState } from 'react';
import { Home, UserPlus, ArrowRight, Loader2, Sparkles, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { householdService } from '../services/householdService';

interface HouseholdSetupProps {
  onSuccess: () => void;
}

export default function HouseholdSetup({ onSuccess }: HouseholdSetupProps) {
  const { t } = useTranslation();
  const [createData, setCreateData] = useState({ name: '', description: '', baseCurrency: 'HUF' });
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading('create');
    setError('');
    try {
      await householdService.createHousehold(createData.name, createData.description, createData.baseCurrency);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(null);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading('join');
    setError('');
    try {
      await householdService.joinHousehold(joinCode);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(null);
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
        <div className="flex flex-col p-10 rounded-[2.5rem] bg-neutral-900/40 border border-neutral-800/60 backdrop-blur-xl relative overflow-hidden group">
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
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest ml-1">{t('household.setup.create.nameLabel')}</label>
                  <input
                    type="text"
                    required
                    value={createData.name}
                    onChange={(e) => setCreateData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-5 py-3.5 bg-neutral-950/50 border border-neutral-800 rounded-2xl text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                    placeholder={t('household.setup.create.namePlaceholder')}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest ml-1">{t('household.setup.create.descLabel')}</label>
                  <input
                    type="text"
                    value={createData.description}
                    onChange={(e) => setCreateData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-5 py-3.5 bg-neutral-950/50 border border-neutral-800 rounded-2xl text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                    placeholder={t('household.setup.create.descPlaceholder')}
                  />
                </div>

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

              <button
                type="submit"
                disabled={!!isLoading || !createData.name}
                className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center transition-all mt-auto ${
                  isLoading === 'create' || !createData.name
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.2)] active:scale-[0.98]'
                }`}
              >
                {isLoading === 'create' ? <Loader2 className="animate-spin" /> : t('household.setup.create.submit')}
              </button>
            </form>
          </div>
        </div>

        {/* Join Household Card */}
        <div className="flex flex-col p-10 rounded-[2.5rem] bg-neutral-900/40 border border-neutral-800/60 backdrop-blur-xl relative overflow-hidden group">
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
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest ml-1">{t('household.setup.join.codeLabel')}</label>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-6 py-5 bg-neutral-950/50 border border-neutral-800 rounded-2xl text-center text-3xl font-mono tracking-widest text-emerald-400 placeholder-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                  placeholder="XXXX-XXXX"
                />
              </div>

              <button
                type="submit"
                disabled={!!isLoading || !joinCode}
                className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center transition-all mt-auto ${
                  isLoading === 'join' || !joinCode
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_25px_rgba(37,99,235,0.2)] active:scale-[0.98]'
                }`}
              >
                {isLoading === 'join' ? <Loader2 className="animate-spin" /> : <>{t('household.setup.join.submit')} <ArrowRight className="ml-2" size={20} /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}