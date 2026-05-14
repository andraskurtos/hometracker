import { createContext, useContext, useState, useMemo, useEffect, type FC, type ReactNode } from 'react';
import { storageService } from '@/services/storageService';
import { useProfile, useLogout as useProfileLogout } from '@/features/profile/hooks/useProfile';

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  userName: string | null;
  login: (token: string, userId: string, name: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(storageService.isAuthenticated());
  const logoutMutation = useProfileLogout();
  
  // We use the profile query to sync data if authenticated
  const { data: profile, isLoading } = useProfile(isAuthenticated);

  const userId = useMemo(() => {
    return profile?.id || storageService.getUserId();
  }, [profile]);

  const userName = useMemo(() => {
    if (profile) return profile.display_name || `${profile.first_name} ${profile.last_name}`;
    return storageService.getUserName();
  }, [profile]);

  // Sync userId to storage if it's found in profile but missing in storage
  useEffect(() => {
    if (profile?.id && !storageService.getUserId()) {
      storageService.setUserId(profile.id);
    }
  }, [profile]);

  const login = (token: string, userId: string, name: string) => {
    storageService.setToken(token);
    storageService.setUserId(userId);
    storageService.setUserName(name);
    setIsAuthenticated(true);
  };

  const logout = () => {
    storageService.clearAll();
    setIsAuthenticated(false);
    logoutMutation(); // Clears React Query cache and navigates
  };

  const value = {
    isAuthenticated,
    userId,
    userName,
    login,
    logout,
    isLoading: isAuthenticated && isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
