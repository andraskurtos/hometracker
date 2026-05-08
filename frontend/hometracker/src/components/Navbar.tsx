import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Languages, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface NavbarProps {
  onProfileClick: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
}

export default function Navbar({ onProfileClick, onLogout, isAuthenticated }: NavbarProps) {
  const { t, i18n } = useTranslation();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hu', label: 'Magyar', flag: '🇭🇺' }
  ];

  const currentLanguage = languages.find(l => l.code === i18n.language.split('-')[0]) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setIsLangOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-neutral-950/80 backdrop-blur-md border-b border-neutral-900/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left Side: Logo */}
        <div className="flex-1">
          <Link 
            to="/"
            className="text-xl font-extrabold tracking-wide bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
          >
            {t('common.appName')}
          </Link>
        </div>

        {/* Right Side: Language & Auth */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Language Toggle */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 transition-all duration-200"
            >
              <Languages size={18} />
              <span className="text-xs font-bold uppercase hidden sm:block">{currentLanguage.code}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-40 py-2 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => toggleLanguage(lang.code)}
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
          {isAuthenticated && (
            <div className="flex items-center gap-2 border-l border-neutral-800 pl-2 md:pl-4 ml-1 md:ml-0">
              <button 
                onClick={onProfileClick}
                className="p-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all duration-200"
                title={t('common.profileSettings')}
              >
                <User size={20} />
              </button>
              <button 
                onClick={onLogout}
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
}