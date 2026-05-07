import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from "./components/Navbar"
import ReceiptSplitter from "./components/ReceiptSplitter"
import Launchpad from "./components/Launchpad"
import Login from "./components/Login"
import Profile from "./components/Profile"
import Landing from "./components/Landing"

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
  const navigate = useNavigate();
  const location = useLocation();

  // Check if they are already logged in when they open the app
  useEffect(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('userName');
    if (token) {
      setIsAuthenticated(true);
      if (name) setUserName(name);
      
      // If user is at landing/login but is authenticated, send to dashboard
      if (location.pathname === '/landing' || location.pathname === '/login' || location.pathname === '/register') {
        navigate('/', { replace: true });
      }
    }
  }, [navigate, location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
    navigate('/landing');
  };

  const handleLoginSuccess = (token: string, name: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userName', name);
    setIsAuthenticated(true);
    setUserName(name);
    navigate('/');
  };

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
              <div className="w-full max-w-5xl flex flex-col items-center gap-8">
                <Launchpad />
                <ReceiptSplitter />
              </div>
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