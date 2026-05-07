import { useState, useEffect } from 'react';
import Navbar from "./components/Navbar"
import ReceiptSplitter from "./components/ReceiptSplitter"
import Launchpad from "./components/Launchpad"
import Login from "./components/Login" // <-- Import it

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');

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
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col text-neutral-200">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {!isAuthenticated ? (
          <Login 
            onLoginSuccess={(token, name) => {
              setIsAuthenticated(true);
              setUserName(name);
            }} 
          />
        ) : (
          <div className="w-full max-w-4xl flex flex-col items-center gap-8">
            <div className="w-full flex justify-between items-center px-4">
              <h1 className="text-2xl font-bold">Welcome, {userName}!</h1>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Log Out
              </button>
            </div>
            
            <Launchpad />
            <ReceiptSplitter />
          </div>
        )}
      </main>
    </div>
  )
}

export default App;