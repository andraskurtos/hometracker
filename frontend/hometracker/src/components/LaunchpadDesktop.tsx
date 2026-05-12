import { Card } from './ui/Card';
import { type LaunchpadLogic } from './useLaunchpadLogic';

interface LaunchpadDesktopProps {
  logic: LaunchpadLogic;
}

export const LaunchpadDesktop = ({ logic }: LaunchpadDesktopProps) => {
  const { modules, navigate } = logic;

  return (
    <div className="w-full max-w-7xl mx-auto mt-12 flex justify-center px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Card
              key={mod.name}
              hoverable
              padding="py-12 px-6"
              onClick={() => navigate(mod.path)}
              className={`group flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ease-out hover:-translate-y-3 rounded-[2.5rem] ${mod.bgHover}`}
            >
              <div className={`p-5 rounded-[1.5rem] bg-neutral-800/50 mb-6 transition-all duration-500 group-hover:scale-110 group-hover:bg-neutral-800 shadow-xl ${mod.color}`}>
                <Icon size={36} strokeWidth={1} />
              </div>
              
              <h3 className="text-xl font-black text-neutral-100 tracking-tight mb-2 text-center">
                {mod.name}
              </h3>
              <p className="text-xs text-neutral-500 text-center font-medium opacity-80">
                {mod.description}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
