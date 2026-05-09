import { Menu, X, User, LogOut, Settings, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { NavbarProps } from './Navbar';

interface MobileProps extends NavbarProps {
  logic: ReturnType<typeof import('./useNavbarLogic').useNavbarLogic>;
}

export const NavbarMobile = ({ logic, ...props }: MobileProps) => {
  const { t, i18n, isMenuOpen, setIsMenuOpen, languages } = logic;
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 w-full bg-neutral-950/90 backdrop-blur-lg border-b border-neutral-900/50">
      <div className="px-5 h-16 flex items-center justify-between">
        <Link to="/" className="text-lg font-extrabold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
          {t('common.appName')}
        </Link>

        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-neutral-400 hover:text-emerald-400 transition-colors"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="absolute top-16 left-0 w-full h-[calc(100vh-64px)] bg-neutral-950/95 backdrop-blur-2xl animate-in fade-in slide-in-from-top-4 duration-300 z-50 overflow-y-auto px-6 py-8">
          
          {/* Household Selection Section */}
          {props.isAuthenticated && (
            <div className="mb-8">
              <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold mb-4 block">
                {t('launchpad.household.name')}
              </label>
              <div className="space-y-2">
                {props.households.map(h => (
                  <div
                    key={h.id}
                    onClick={() => { props.onSelectHousehold?.(h.id); setIsMenuOpen(false); }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      h.id === props.activeHousehold?.id 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-neutral-900/50 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <span className="font-bold">{h.name}</span>
                    <div className="flex items-center gap-3">
                      {h.id === props.activeHousehold?.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            props.onManageHousehold?.();
                            setIsMenuOpen(false);
                          }}
                          className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400"
                        >
                          <Settings size={16} />
                        </button>
                      )}
                      {h.id === props.activeHousehold?.id && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />}
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={() => { navigate('/setup-household'); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 text-neutral-500 font-bold"
                >
                  <Plus size={18} />
                  <span>{t('household.setup.title')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Settings & Auth */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => { props.onProfileClick(); setIsMenuOpen(false); }}
              className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-neutral-900/50 border border-neutral-800 text-neutral-300"
            >
              <User size={24} className="text-emerald-400" />
              <span className="text-xs font-bold">{t('common.profileSettings').split(' ')[0]}</span>
            </button>
            <button 
              onClick={() => { props.onLogout(); setIsMenuOpen(false); }}
              className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-neutral-900/50 border border-neutral-800 text-neutral-300"
            >
              <LogOut size={24} className="text-red-400" />
              <span className="text-xs font-bold">{t('common.logOut')}</span>
            </button>
          </div>

          {/* Language Switcher at Bottom */}
          <div className="mt-8 pt-8 border-t border-neutral-900 flex justify-center gap-4">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  i18n.language.startsWith(lang.code)
                  ? 'bg-emerald-500 text-neutral-950'
                  : 'bg-neutral-900 text-neutral-500'
                }`}
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};