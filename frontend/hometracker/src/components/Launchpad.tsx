import { useLaunchpadLogic } from './useLaunchpadLogic';
import { LaunchpadDesktop } from './LaunchpadDesktop';
import { LaunchpadMobile } from './LaunchpadMobile';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { GlobalDebtSummary } from './GlobalDebtSummary';

interface LaunchpadProps {
  activeHouseholdId?: string | null;
  currency?: string;
}

export default function Launchpad({ activeHouseholdId, currency }: LaunchpadProps) {
  const logic = useLaunchpadLogic();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <div className="w-full flex flex-col items-center">
      {activeHouseholdId && <GlobalDebtSummary householdId={activeHouseholdId} currency={currency} />}
      {isDesktop ? (
        <LaunchpadDesktop logic={logic} />
      ) : (
        <LaunchpadMobile logic={logic} />
      )}
    </div>
  );
}
