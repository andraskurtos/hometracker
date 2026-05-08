import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userService } from '../services/userService';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface LoginProps {
  onLoginSuccess: (token: string, userName: string) => void;
  initialMode: 'login' | 'register';
}

export default function Login({ onLoginSuccess, initialMode }: LoginProps) {
  const { t } = useTranslation();
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
      setError(t('auth.passwordsDoNotMatch'));
      setIsLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        const data = await userService.login(email, password);
        onLoginSuccess(data.access_token, data.user.first_name);
      } else {
        await userService.register(email, password, firstName, lastName);
        setSuccess(t('auth.accountCreated'));
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
    <Card className="w-full max-w-md relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <h2 className="text-3xl font-extrabold text-neutral-200 mb-2">
          {mode === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}
        </h2>
        <p className="text-neutral-500 mb-8">
          {mode === 'login' 
            ? t('auth.loginDescription') 
            : t('auth.registerDescription')}
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
              <Input
                type="text"
                name="given-name"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                icon={<User className="h-4 w-4" />}
                placeholder={t('auth.firstName')}
                className="text-sm"
              />
              <Input
                type="text"
                name="family-name"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                icon={<User className="h-4 w-4" />}
                placeholder={t('auth.lastName')}
                className="text-sm"
              />
            </div>
          )}

          <Input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-5 w-5" />}
            placeholder={t('auth.email')}
          />

          <Input
            type="password"
            name="password"
            autoComplete={mode === 'login' ? "current-password" : "new-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="h-5 w-5" />}
            placeholder={t('auth.password')}
          />

          {mode === 'register' && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-300">
              <Input
                type="password"
                name="confirm-password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock className="h-5 w-5" />}
                placeholder={t('auth.confirmPassword')}
              />
            </div>
          )}

          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!isFormValid()}
            variant={isLoading || !isFormValid() ? 'neutral' : 'primary'}
            className="w-full py-3.5 text-lg mt-4"
            icon={<ArrowRight className="ml-2 w-5 h-5 order-last" />}
          >
            {mode === 'login' ? t('auth.signIn') : t('auth.signUp')}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate(mode === 'login' ? '/register' : '/login')}
            className="text-neutral-500 hover:text-emerald-400 transition-colors text-sm font-medium"
          >
            {mode === 'login' 
              ? t('auth.noAccount') 
              : t('auth.hasAccount')}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button 
            onClick={() => navigate('/landing')}
            className="text-neutral-600 hover:text-neutral-400 transition-colors text-xs"
          >
            {t('auth.backToLanding')}
          </button>
        </div>
      </div>
    </Card>
  );
}
