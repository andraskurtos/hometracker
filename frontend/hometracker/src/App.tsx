import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from "./components/Navbar"
import ReceiptSplitter from "./components/ReceiptSplitter"
import Launchpad from "./components/Launchpad"
import Login from "./components/Login"
import Profile from "./components/Profile"
import Landing from "./components/Landing"
import HouseholdSetup from "./components/HouseholdSetup"
import HouseholdManagement from "./components/HouseholdManagement"
import { ArrowLeft } from 'lucide-react';
import { Button } from './components/ui/Button';
import { useMyHouseholds } from './hooks/useHouseholds';
import { useProfile, useLogout } from './hooks/useProfile';

// --- Protected Route Wrapper ---
const ProtectedRoute = ({ children, isAuthenticated }: { children: JSX.Element, isAuthenticated: boolean }) => {
  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }
  return children;
};

function App() {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const [activeHouseholdId, setActiveHouseholdId] = useState<number | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();

  // Queries
  const { 
    data: households = [], 
    isLoading: isLoadingHouseholds, 
    refetch: refetchHouseholds 
  } = useMyHouseholds(isAuthenticated);

  const { data: profile } = useProfile(isAuthenticated);

  const userName = useMemo(() => {
    if (profile) return profile.display_name || `${profile.first_name} ${profile.last_name}`;
    return localStorage.getItem('userName') || '';
  }, [profile]);

  // Active household object
  const activeHousehold = useMemo(() => {
    if (households.length === 0) return null;
    return households.find(h => h.id === activeHouseholdId) || households[0];
  }, [households, activeHouseholdId]);

  // Initial redirect logic
  useEffect(() => {
    if (isAuthenticated && !isLoadingHouseholds) {
      const isPublicPath = ['/landing', '/login', '/register'].includes(location.pathname);
      
      if (households.length === 0 && !isPublicPath) {
        navigate('/setup-household', { replace: true });
      } else if (households.length > 0 && location.pathname === '/setup-household') {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, isLoadingHouseholds, households.length, location.pathname, navigate]);

  // Handle auth redirection
  useEffect(() => {
    if (isAuthenticated) {
      if (['/landing', '/login', '/register'].includes(location.pathname)) {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, navigate, location.pathname]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveHouseholdId(null);
    logout();
  };

  const handleLoginSuccess = (token: string, name: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userName', name);
    setIsAuthenticated(true);
  };

  if (isAuthenticated && isLoadingHouseholds) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col text-neutral-200">
      <Navbar 
        isAuthenticated={isAuthenticated} 
        onProfileClick={() => navigate('/profile')} 
        onLogout={handleLogout}
        households={households}
        activeHousehold={activeHousehold}
        onSelectHousehold={(id) => {
          setActiveHouseholdId(id);
          navigate('/'); // Go home on switch
        }}
        onManageHousehold={() => navigate('/household')}
      />
      
      <main className="flex-1 flex flex-col items-center justify-start p-6 pt-12">
        <Routes>
          {/* Public Routes */}
          <Route path="/landing" element={
            !isAuthenticated ? <Landing onLoginClick={() => navigate('/login')} /> : <Navigate to="/" />
          } />
          
          <Route path="/login" element={
            !isAuthenticated ? <Login onLoginSuccess={handleLoginSuccess} initialMode="login" /> : <Navigate to="/" />
          } />

          <Route path="/register" element={
            !isAuthenticated ? <Login onLoginSuccess={handleLoginSuccess} initialMode="register" /> : <Navigate to="/" />
          } />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              {households.length > 0 ? (
                <Launchpad />
              ) : (
                <Navigate to="/setup-household" replace />
              )}
            </ProtectedRoute>
          } />

          <Route path="/groceries" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <div className="w-full max-w-5xl flex flex-col items-start gap-6">
                <Button 
                  variant="ghost"
                  onClick={() => navigate('/')}
                  icon={ArrowLeft}
                >
                  {t('common.backToLaunchpad')}
                </Button>
                <ReceiptSplitter />
              </div>
            </ProtectedRoute>
          } />

          <Route path="/household" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              {activeHousehold ? (
                <HouseholdManagement 
                  household={activeHousehold} 
                  onBack={() => navigate('/')} 
                  onUpdate={refetchHouseholds}
                />
              ) : (
                <Navigate to="/setup-household" replace />
              )}
            </ProtectedRoute>
          } />

          <Route path="/setup-household" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              {households.length === 0 ? (
                <HouseholdSetup onSuccess={refetchHouseholds} />
              ) : (
                <Navigate to="/" replace />
              )}
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Profile 
                userName={userName} 
                onBack={() => navigate('/')} 
              />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/landing"} replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App;
