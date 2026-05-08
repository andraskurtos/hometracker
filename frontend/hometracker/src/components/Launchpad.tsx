import { ShoppingBasket, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from './ui/Card';

export default function Launchpad() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const modules = [
    { 
      name: t('launchpad.groceries.name'), 
      description: t('launchpad.groceries.description'), 
      icon: ShoppingBasket, 
      color: 'text-emerald-400', 
      bgHover: 'hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]',
      path: '/groceries'
    },
    { 
      name: t('launchpad.household.name'), 
      description: t('launchpad.household.description'), 
      icon: Home, 
      color: 'text-blue-400', 
      bgHover: 'hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(37,99,235,0.15)]',
      path: '/household'
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 flex justify-center">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-2xl">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.name}
              onClick={() => navigate(mod.path)}
              className="group"
            >
              <Card 
                hoverable 
                className={`flex flex-col items-center justify-center p-10 rounded-[2.5rem] transition-all duration-300 ease-out group-hover:-translate-y-2 ${mod.bgHover}`}
              >
                <div className={`p-5 rounded-2xl bg-neutral-800/50 mb-6 transition-transform duration-300 group-hover:scale-110 ${mod.color}`}>
                  <Icon size={40} strokeWidth={1.5} />
                </div>
                
                <h3 className="text-xl font-bold text-neutral-100 tracking-wide mb-2">
                  {mod.name}
                </h3>
                <p className="text-sm text-neutral-500">
                  {mod.description}
                </p>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
