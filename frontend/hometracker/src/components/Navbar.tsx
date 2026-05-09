import { useNavbarLogic } from './useNavbarLogic';
import { NavbarDesktop } from './NavbarDesktop';
import { NavbarMobile } from './NavbarMobile';
import { useMediaQuery } from '../hooks/useMediaQuery'; // You'll need a simple window.matchMedia hook
import type { Household } from '../services/householdService';

export interface NavbarProps {
  onProfileClick: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  households: Household[];
  activeHousehold: Household | null;
  onSelectHousehold?: (id: string) => void;
  onManageHousehold?: () => void;
}

export default function Navbar(props: NavbarProps) {
  const logic = useNavbarLogic();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return isDesktop ? (
    <NavbarDesktop logic={logic} {...props} />
  ) : (
    <NavbarMobile logic={logic} {...props} />
  );
}