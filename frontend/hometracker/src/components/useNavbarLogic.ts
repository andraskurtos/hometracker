import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useNavbarLogic = () => {
  const { t, i18n } = useTranslation();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isHouseholdOpen, setIsHouseholdOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // For mobile hamburger

  const langDropdownRef = useRef<HTMLDivElement>(null);
  const householdDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
      if (householdDropdownRef.current && !householdDropdownRef.current.contains(event.target as Node)) {
        setIsHouseholdOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hu', label: 'Magyar', flag: '🇭🇺' }
  ];

  const currentLanguage = languages.find(l => l.code === i18n.language.split('-')[0]) || languages[0];

  return {
    t, i18n,
    isLangOpen, setIsLangOpen,
    isHouseholdOpen, setIsHouseholdOpen,
    isMenuOpen, setIsMenuOpen,
    langDropdownRef, householdDropdownRef,
    languages, currentLanguage
  };
};