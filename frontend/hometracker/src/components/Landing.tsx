import { Receipt, Shield, Zap, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LandingProps {
  onLoginClick: () => void;
}

export default function Landing({ onLoginClick }: LandingProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[80vh] px-6 text-center animate-in fade-in zoom-in-95 duration-1000">
      {/* Hero Badge */}
      <div className="mb-8 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium tracking-wide">
        {t('landing.badge')}
      </div>

      {/* Main Logo & Title */}
      <div className="relative mb-6">
        <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl rounded-full opacity-50" />
        <h1 className="relative text-6xl md:text-8xl font-black tracking-tighter bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent">
          {t('common.appName')}
        </h1>
      </div>

      <p className="text-xl md:text-2xl text-neutral-400 max-w-2xl mb-12 leading-relaxed">
        {t('landing.description')}
      </p>

      {/* Primary Action */}
      <button 
        onClick={onLoginClick}
        className="group relative flex items-center gap-3 px-10 py-5 bg-neutral-100 text-neutral-950 font-bold text-lg rounded-2xl hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.1)] active:scale-95"
      >
        {t('landing.accessDashboard')}
        <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Features Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full">
        <div className="p-8 rounded-3xl bg-neutral-900/40 border border-neutral-800/60 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6">
            < Zap size={24} />
          </div>
          <h3 className="text-xl font-bold mb-3">{t('landing.features.ocr.title')}</h3>
          <p className="text-neutral-500">{t('landing.features.ocr.description')}</p>
        </div>

        <div className="p-8 rounded-3xl bg-neutral-900/40 border border-neutral-800/60 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6">
            <Receipt size={24} />
          </div>
          <h3 className="text-xl font-bold mb-3">{t('landing.features.splitting.title')}</h3>
          <p className="text-neutral-500">{t('landing.features.splitting.description')}</p>
        </div>

        <div className="p-8 rounded-3xl bg-neutral-900/40 border border-neutral-800/60 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6">
            <Shield size={24} />
          </div>
          <h3 className="text-xl font-bold mb-3">{t('landing.features.privacy.title')}</h3>
          <p className="text-neutral-500">{t('landing.features.privacy.description')}</p>
        </div>
      </div>
    </div>
  );
}