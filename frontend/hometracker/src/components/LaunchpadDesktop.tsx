import { Card } from './ui/Card';
import { type LaunchpadLogic } from './useLaunchpadLogic';

interface LaunchpadDesktopProps {
  logic: LaunchpadLogic;
}

export const LaunchpadDesktop = ({ logic }: LaunchpadDesktopProps) => {
  const { modules, navigate } = logic;

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 flex justify-center px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-3xl">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Card
              key={mod.name}
              hoverable
              padding="py-20 px-12"
              onClick={() => navigate(mod.path)}
              className={`group flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ease-out hover:-translate-y-3 rounded-[3rem] ${mod.bgHover}`}
            >
              <div className={`p-6 rounded-[2rem] bg-neutral-800/50 mb-8 transition-all duration-500 group-hover:scale-110 group-hover:bg-neutral-800 shadow-2xl ${mod.color}`}>
                <Icon size={48} strokeWidth={1} />
              </div>
              
              <h3 className="text-2xl font-black text-neutral-100 tracking-tight mb-3">
                {mod.name}
              </h3>
              <p className="text-base text-neutral-500 text-center font-medium max-w-[200px]">
                {mod.description}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
