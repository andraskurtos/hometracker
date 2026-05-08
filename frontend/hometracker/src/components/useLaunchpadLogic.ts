import { ShoppingBasket, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const useLaunchpadLogic = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const modules = [
    { 
      name: t('launchpad.groceries.name'), 
      description: t('launchpad.groceries.description'), 
      icon: ShoppingBasket, 
      color: 'text-emerald-400', 
      bgHover: 'hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]',
      path: '/groceries'
    }
  ];

  return {
    modules,
    navigate
  };
};

export type LaunchpadLogic = ReturnType<typeof useLaunchpadLogic>;
