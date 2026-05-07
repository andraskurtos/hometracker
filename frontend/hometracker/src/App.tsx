import { useState, useEffect } from 'react';
import Navbar from "./components/Navbar"
import ReceiptSplitter from "./components/ReceiptSplitter"
import Launchpad from "./components/Launchpad"
import Login from "./components/Login"
import Profile from "./components/Profile"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [view, setView] = useState<'dashboard' | 'profile'>('dashboard');

  // Check if they are already logged in when they open the app
  useEffect(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('userName');
    if (token) {
      setIsAuthenticated(true);
      if (name) setUserName(name);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
    setView('dashboard');
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col text-neutral-200">
      <Navbar 
        isAuthenticated={isAuthenticated} 
        onProfileClick={() => setView('profile')} 
        onLogout={handleLogout}
      />
      
      <main className="flex-1 flex flex-col items-center justify-start p-6 pt-12">
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center w-full">
            <Login 
              onLoginSuccess={(token, name) => {
                setIsAuthenticated(true);
                setUserName(name);
              }} 
            />
          </div>
        ) : (
          <div className="w-full max-w-5xl flex flex-col items-center gap-8">
            {view === 'profile' ? (
              <Profile 
                userName={userName} 
                onBack={() => setView('dashboard')} 
              />
            ) : (
              <>
                <Launchpad />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App;