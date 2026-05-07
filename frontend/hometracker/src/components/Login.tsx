import React, { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, ArrowRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';

interface LoginProps {
  onLoginSuccess: (token: string, userName: string) => void;
  initialMode: 'login' | 'register';
}

export default function Login({ onLoginSuccess, initialMode }: LoginProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync state if initialMode prop changes (e.g. browser navigation)
  useEffect(() => {
    setMode(initialMode);
    setError('');
    setSuccess('');
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (mode === 'register' && password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        const data = await userService.login(email, password);
        onLoginSuccess(data.access_token, data.user.first_name);
      } else {
        await userService.register(email, password, firstName, lastName);
        setSuccess("Account created successfully! You can now log in.");
        navigate('/login');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    if (mode === 'login') {
      return email && password;
    }
    return email && password && confirmPassword && firstName && lastName;
  };

  return (
    <div className="w-full max-w-md p-8 bg-neutral-900/40 border border-neutral-800/60 backdrop-blur-md rounded-3xl shadow-2xl relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <h2 className="text-3xl font-extrabold text-neutral-200 mb-2">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-neutral-500 mb-8">
          {mode === 'login' 
            ? 'Enter your credentials to access your dashboard.' 
            : 'Fill in the details below to get started.'}
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium text-center animate-in fade-in zoom-in-95 duration-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm font-medium text-center animate-in fade-in zoom-in-95 duration-300">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-neutral-500" />
                </div>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm"
                  placeholder="First Name"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-neutral-500" />
                </div>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm"
                  placeholder="Last Name"
                />
              </div>
            </div>
          )}

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

          {mode === 'register' && (
            <div className="relative animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-neutral-500" />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                placeholder="Confirm Password"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !isFormValid()}
            className={`w-full py-3.5 rounded-xl font-bold text-lg flex items-center justify-center transition-all mt-4 ${
              isLoading || !isFormValid()
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'Sign In' : 'Sign Up'} <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate(mode === 'login' ? '/register' : '/login')}
            className="text-neutral-500 hover:text-emerald-400 transition-colors text-sm font-medium"
          >
            {mode === 'login' 
              ? "Don't have an account? Sign Up" 
              : "Already have an account? Sign In"}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button 
            onClick={() => navigate('/landing')}
            className="text-neutral-600 hover:text-neutral-400 transition-colors text-xs"
          >
            ← Back to landing
          </button>
        </div>
      </div>
    </div>
  );
}