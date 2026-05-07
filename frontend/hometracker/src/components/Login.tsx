import React, { useState } from 'react';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (token: string, userName: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // In production, use your dynamic API_BASE_URL here
      const response = await fetch(`http://${window.location.hostname}:8000/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Save token to localStorage so they stay logged in!
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userName', data.user.first_name);
      
      // Tell the parent App component we succeeded
      onLoginSuccess(data.access_token, data.user.first_name);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-neutral-900/40 border border-neutral-800/60 backdrop-blur-md rounded-3xl shadow-2xl relative overflow-hidden">
      
      {/* Decorative background glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <h2 className="text-3xl font-extrabold text-neutral-200 mb-2">Welcome Back</h2>
        <p className="text-neutral-500 mb-8">Enter your credentials to access your pantry.</p>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-neutral-500" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              placeholder="Email address"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-neutral-500" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className={`w-full py-3.5 rounded-xl font-bold text-lg flex items-center justify-center transition-all mt-4 ${
              isLoading || !email || !password
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}