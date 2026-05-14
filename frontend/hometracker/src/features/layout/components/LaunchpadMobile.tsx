import { Card } from '@/components/ui/Card';
import { type LaunchpadLogic } from '@/features/layout/hooks/useLaunchpadLogic';

interface LaunchpadMobileProps {
  logic: LaunchpadLogic;
}

export const LaunchpadMobile = ({ logic }: LaunchpadMobileProps) => {
  const { modules, navigate } = logic;

  return (
    <div className="w-full px-6 py-12 flex flex-col items-center">
      <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
        {modules.map((mod: LaunchpadLogic['modules'][number]) => {
          const Icon = mod.icon;
          return (
            <Card
              key={mod.name}
              hoverable
              padding="p-6"
              onClick={() => navigate(mod.path)}
              className="flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in duration-500 rounded-[2.5rem]"
            >
              <div className={`p-5 rounded-[1.5rem] bg-neutral-800/50 border border-neutral-700/30 shadow-inner transition-transform active:scale-90 ${mod.color}`}>
                <Icon size={32} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-black text-neutral-100 tracking-tight text-center">
                  {mod.name}
                </span>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-center opacity-80">
                  {mod.description}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
