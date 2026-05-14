import { Mail, Lock, ArrowRight, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLoginLogic } from '../hooks/useLoginLogic';

interface LoginProps {
  onLoginSuccess: (token: string, userId: string, userName: string) => void;
  initialMode: 'login' | 'register';
}

export default function Login({ onLoginSuccess, initialMode }: LoginProps) {
  const logic = useLoginLogic({ onLoginSuccess, initialMode });
  const {
    t,
    mode,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    isLoading,
    error,
    success,
    handleSubmit,
    isFormValid,
    toggleMode,
    goToLanding
  } = logic;

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
            onClick={toggleMode}
            className="text-neutral-500 hover:text-emerald-400 transition-colors text-sm font-medium"
          >
            {mode === 'login' 
              ? t('auth.noAccount') 
              : t('auth.hasAccount')}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button 
            onClick={goToLanding}
            className="text-neutral-600 hover:text-neutral-400 transition-colors text-xs"
          >
            {t('auth.backToLanding')}
          </button>
        </div>
      </div>
    </Card>
  );
}
