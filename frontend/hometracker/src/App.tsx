import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { householdService } from "./services/householdService"
import type { Household } from "./services/householdService"
import { ArrowLeft } from 'lucide-react';
import { Button } from './components/ui/Button';

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
  const [userName, setUserName] = useState<string>(localStorage.getItem('userName') || '');
  const [households, setHouseholds] = useState<Household[]>([]);
  const [activeHouseholdId, setActiveHouseholdId] = useState<number | null>(null);
  const [isCheckingHouseholds, setIsCheckingHouseholds] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Active household object
  const activeHousehold = useMemo(() => {
    if (!activeHouseholdId) return households[0] || null;
    return households.find(h => h.id === activeHouseholdId) || households[0] || null;
  }, [households, activeHouseholdId]);

  const fetchHouseholds = useCallback(async () => {
    if (!isAuthenticated) {
      setIsCheckingHouseholds(false);
      return;
    }
    try {
      const data = await householdService.getMyHouseholds();
      setHouseholds(data);
      
      // Default to first household if none selected or current one no longer exists
      if (data.length > 0) {
        if (!activeHouseholdId || !data.find(h => h.id === activeHouseholdId)) {
          setActiveHouseholdId(data[0].id);
        }
      }

      const isPublicPath = ['/landing', '/login', '/register'].includes(location.pathname);
      
      if (data.length === 0 && !isPublicPath) {
        navigate('/setup-household', { replace: true });
      } else if (data.length > 0 && location.pathname === '/setup-household') {
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error("Failed to fetch households", err);
    } finally {
      setIsCheckingHouseholds(false);
    }
  }, [isAuthenticated, navigate, location.pathname, activeHouseholdId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('userName');
    if (token) {
      setIsAuthenticated(true);
      if (name) setUserName(name);
      
      if (location.pathname === '/landing' || location.pathname === '/login' || location.pathname === '/register') {
        navigate('/', { replace: true });
      }
    } else {
      setIsCheckingHouseholds(false);
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    fetchHouseholds();
  }, [fetchHouseholds]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
    setHouseholds([]);
    setActiveHouseholdId(null);
    navigate('/landing');
  };

  const handleLoginSuccess = (token: string, name: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userName', name);
    setIsAuthenticated(true);
    setUserName(name);
  };

  if (isAuthenticated && isCheckingHouseholds) {
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
                  onUpdate={fetchHouseholds}
                />
              ) : (
                <Navigate to="/setup-household" replace />
              )}
            </ProtectedRoute>
          } />

          <Route path="/setup-household" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              {households.length === 0 ? (
                <HouseholdSetup onSuccess={fetchHouseholds} />
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