import { useEffect, useMemo, type JSX } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Layout & UI
import Navbar from "./features/layout/components/Navbar"
import { ReturnButton } from './components/ui/ReturnButton';
import { Spinner } from './components/ui/Spinner';

// Features
import ReceiptSplitter from "./features/receipts/components/ReceiptSplitter"
import Launchpad from "./features/layout/components/Launchpad"
import Login from "./features/auth/components/Login"
import Profile from "./features/profile/components/Profile"
import Landing from "./features/auth/components/Landing"
import HouseholdSetup from "./features/households/components/HouseholdSetup"
import HouseholdManagement from "./features/households/components/HouseholdManagement"

// Context & Hooks
import { useAuth } from './features/auth/AuthContext';
import { useMyHouseholds } from './features/households/hooks/useHouseholds';
import { useState } from 'react';

// --- Protected Route Wrapper ---
const ProtectedRoute = ({ children, isAuthenticated }: { children: JSX.Element, isAuthenticated: boolean }) => {
  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }
  return children;
};

function App() {
  const { t } = useTranslation();
  const { isAuthenticated, login, logout, userName, isLoading: isAuthLoading } = useAuth();
  const [activeHouseholdId, setActiveHouseholdId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Queries
  const { 
    data: households = [], 
    isLoading: isLoadingHouseholds, 
    refetch: refetchHouseholds 
  } = useMyHouseholds(isAuthenticated);

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

  if (isAuthLoading || (isAuthenticated && isLoadingHouseholds)) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col text-neutral-200">
      <Navbar 
        isAuthenticated={isAuthenticated} 
        onProfileClick={() => navigate('/profile')} 
        onLogout={logout}
        households={households}
        activeHousehold={activeHousehold}
        onSelectHousehold={(id) => {
          setActiveHouseholdId(id);
          navigate('/'); // Go home on switch
        }}
        onManageHousehold={() => navigate('/household')}
      />
      
      <main className="flex-1 flex flex-col items-center justify-start p-6 pt-12">
        <div key={location.key} className="w-full flex flex-col items-center animate-page-in">
          <Routes location={location}>
            {/* Public Routes */}
            <Route path="/landing" element={
              !isAuthenticated ? <Landing onLoginClick={() => navigate('/login')} /> : <Navigate to="/" />
            } />
            
            <Route path="/login" element={
              !isAuthenticated ? <Login onLoginSuccess={login} initialMode="login" /> : <Navigate to="/" />
            } />

            <Route path="/register" element={
              !isAuthenticated ? <Login onLoginSuccess={login} initialMode="register" /> : <Navigate to="/" />
            } />

            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                {households.length > 0 ? (
                  <Launchpad 
                    activeHouseholdId={activeHousehold?.id} 
                    currency={activeHousehold?.base_currency}
                  />
                ) : (
                  <Navigate to="/setup-household" replace />
                )}
              </ProtectedRoute>
            } />

            <Route path="/groceries" element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <div className="w-full max-w-5xl flex flex-col items-start gap-6">
                  <ReturnButton 
                    onClick={() => navigate('/')}
                    label={t('common.backToDashboard')}
                  />
                  <ReceiptSplitter householdId={activeHousehold?.id || null} />
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
                <HouseholdSetup onSuccess={(id: string) => {
                  refetchHouseholds();
                  setActiveHouseholdId(id);
                  navigate('/');
                }} />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Profile 
                  userName={userName || ''} 
                  onBack={() => navigate('/')} 
                />
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/landing"} replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App;
