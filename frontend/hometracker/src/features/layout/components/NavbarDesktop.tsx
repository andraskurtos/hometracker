import { User, LogOut, Languages, ChevronDown, Home, Settings, Check, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { NavbarProps } from './Navbar';
import { useNavbarLogic } from '@/features/layout/hooks/useNavbarLogic';

interface DesktopProps extends NavbarProps {
  logic: ReturnType<typeof useNavbarLogic>;
}

export const NavbarDesktop = ({ logic, ...props }: DesktopProps) => {
  const { 
    t, 
    i18n,
    isLangOpen, 
    setIsLangOpen, 
    isHouseholdOpen, 
    setIsHouseholdOpen, 
    langDropdownRef, 
    householdDropdownRef, 
    languages, 
    currentLanguage 
  } = logic;
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 w-full bg-neutral-950/80 backdrop-blur-md border-b border-neutral-900/50 hidden lg:block">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Logo */}
        <div className="flex-none">
          <Link 
            to="/" 
            className="text-xl font-extrabold tracking-wide bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
          >
            {t('common.appName')}
          </Link>
        </div>

        {/* Center: Household Switcher (only if authenticated and has households) */}
        {props.isAuthenticated && props.households.length > 0 && (
          <div className="flex-1 flex justify-center max-w-md">
            <div className="relative w-full" ref={householdDropdownRef}>
              <button 
                onClick={() => setIsHouseholdOpen(!isHouseholdOpen)}
                className="w-full flex items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex-none p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Home size={16} />
                  </div>
                  <span className="font-bold text-sm text-neutral-200 truncate">
                    {props.activeHousehold?.name || 'Select Household'}
                  </span>
                </div>
                <ChevronDown size={16} className={`text-neutral-500 transition-transform duration-300 ${isHouseholdOpen ? 'rotate-180' : ''}`} />
              </button>

              {isHouseholdOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <div className="max-h-60 overflow-y-auto scrollbar-hide">
                    {props.households.map((h) => (
                      <div
                        key={h.id}
                        onClick={() => {
                          props.onSelectHousehold?.(h.id);
                          setIsHouseholdOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl mb-1 transition-all cursor-pointer ${
                          h.id === props.activeHousehold?.id 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
                        }`}
                      >
                        <div className="flex flex-col items-start overflow-hidden text-left">
                          <span className="font-bold text-sm truncate w-full">{h.name}</span>
                          <span className="text-[10px] uppercase tracking-widest opacity-60">{h.role}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {h.id === props.activeHousehold?.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                props.onManageHousehold?.();
                                setIsHouseholdOpen(false);
                              }}
                              className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                              title={t('common.profileSettings')}
                            >
                              <Settings size={14} />
                            </button>
                          )}
                          {h.id === props.activeHousehold?.id && <Check size={14} strokeWidth={3} className="text-emerald-400" />}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-neutral-800 mt-1 pt-1 space-y-1">
                    <button
                      onClick={() => {
                        navigate('/setup-household');
                        setIsHouseholdOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300 transition-all text-sm font-bold"
                    >
                      <Plus size={16} />
                      {t('household.setup.title')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Side: Language & Auth */}
        <div className="flex items-center gap-4 flex-none">
          {/* Language Toggle */}
          <div className="relative" ref={langDropdownRef}>
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 transition-all duration-200"
            >
              <Languages size={18} />
              <span className="text-xs font-bold uppercase">{currentLanguage.code}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-40 py-2 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                      setIsLangOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      i18n.language.startsWith(lang.code) 
                        ? 'text-emerald-400 bg-emerald-500/5' 
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span className="font-medium">{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auth Actions */}
          {props.isAuthenticated && (
            <div className="flex items-center gap-2 border-l border-neutral-800 pl-4">
              <button 
                onClick={props.onProfileClick}
                className="p-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all duration-200"
                title={t('common.profileSettings')}
              >
                <User size={20} />
              </button>
              <button 
                onClick={props.onLogout}
                className="p-2 rounded-full bg-neutral-900 border border-neutral-800 text-red-400/80 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200"
                title={t('common.logOut')}
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
