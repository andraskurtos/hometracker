import { useState, useEffect, useCallback, type JSX } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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

// --- Protected Route Wrapper ---
const ProtectedRoute = ({ children, isAuthenticated }: { children: JSX.Element, isAuthenticated: boolean }) => {
  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }
  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const [userName, setUserName] = useState<string>(localStorage.getItem('userName') || '');
  const [households, setHouseholds] = useState<Household[]>([]);
  const [isCheckingHouseholds, setIsCheckingHouseholds] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  const fetchHouseholds = useCallback(async () => {
    if (!isAuthenticated) {
      setIsCheckingHouseholds(false);
      return;
    }
    try {
      const data = await householdService.getMyHouseholds();
      setHouseholds(data);
      
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
  }, [isAuthenticated, navigate, location.pathname]);

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
                <button 
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 text-neutral-500 hover:text-neutral-200 transition-colors group"
                >
                  <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                  <span>Back to Launchpad</span>
                </button>
                <ReceiptSplitter />
              </div>
            </ProtectedRoute>
          } />

          <Route path="/household" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              {households.length > 0 ? (
                <HouseholdManagement 
                  household={households[0]} 
                  onBack={() => navigate('/')} 
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