import { User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onProfileClick: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
}

export default function Navbar({ onProfileClick, onLogout, isAuthenticated }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 w-full bg-neutral-950/80 backdrop-blur-md border-b border-neutral-900/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Spacer for layout balance */}
        <div className="w-20 md:hidden" />

        {/* App Name linked to home */}
        <Link 
          to="/"
          className="text-xl font-extrabold tracking-wide bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
        >
          HomeTracker
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-20 justify-end">
          {isAuthenticated && (
            <>
              <button 
                onClick={onProfileClick}
                className="p-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all duration-200"
                title="Profile Settings"
              >
                <User size={20} />
              </button>
              <button 
                onClick={onLogout}
                className="p-2 rounded-full bg-neutral-900 border border-neutral-800 text-red-400/80 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200"
                title="Log Out"
              >
                <LogOut size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}