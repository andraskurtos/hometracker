import { useLaunchpadLogic } from './useLaunchpadLogic';
import { LaunchpadDesktop } from './LaunchpadDesktop';
import { LaunchpadMobile } from './LaunchpadMobile';
import { useMediaQuery } from '../hooks/useMediaQuery';

export default function Launchpad() {
  const logic = useLaunchpadLogic();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return isDesktop ? (
    <LaunchpadDesktop logic={logic} />
  ) : (
    <LaunchpadMobile logic={logic} />
  );
}
