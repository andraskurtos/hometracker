// src/components/Launchpad.jsx
import { Receipt, Calendar, Home, CheckSquare, ShoppingCart, Settings, ShoppingBag, ShoppingBasket } from 'lucide-react';

export default function Launchpad() {
  // Define our modules here. Each gets a distinct color accent.
  const modules = [
    { name: 'Groceries', description: 'Track shopping', icon: ShoppingBasket, color: 'text-emerald-400', bgHover: 'hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]' }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto mt-8">
      {/* CSS Grid: 1 column on mobile, 2 on tablets, 3 on desktops */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.name}
              className={`group flex flex-col items-center justify-center p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800/60 backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1 ${mod.bgHover}`}
            >
              {/* Icon Container with a subtle background glow on hover */}
              <div className={`p-4 rounded-full bg-neutral-800/50 mb-4 transition-transform duration-300 group-hover:scale-110 ${mod.color}`}>
                <Icon size={32} strokeWidth={1.5} />
              </div>
              
              {/* Text Content */}
              <h3 className="text-lg font-semibold text-neutral-200 tracking-wide mb-1">
                {mod.name}
              </h3>
              <p className="text-sm text-neutral-500">
                {mod.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}