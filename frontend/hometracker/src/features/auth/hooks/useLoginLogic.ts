import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userService } from '@/services/userService';

interface UseLoginLogicProps {
  onLoginSuccess: (token: string, userId: string, userName: string) => void;
  initialMode: 'login' | 'register';
}

export const useLoginLogic = ({ onLoginSuccess, initialMode }: UseLoginLogicProps) => {
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

  const handleSubmit = async (e: FormEvent) => {
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
        onLoginSuccess(data.access_token, data.user.id, data.user.first_name);
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
      return !!(email && password);
    }
    return !!(email && password && confirmPassword && firstName && lastName);
  };

  const toggleMode = () => {
    navigate(mode === 'login' ? '/register' : '/login');
  };

  const goToLanding = () => {
    navigate('/landing');
  };

  return {
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
  };
};

export type LoginLogic = ReturnType<typeof useLoginLogic>;
