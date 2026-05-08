import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'neutral' | 'white';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Button = ({ 
  variant = 'primary', 
  isLoading = false, 
  icon, 
  children, 
  className = '', 
  disabled,
  ...props 
}: ButtonProps) => {
  const variants = {
    primary: 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-[0.98]',
    secondary: 'bg-blue-500 text-white hover:bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] active:scale-[0.98]',
    danger: 'bg-red-500 text-white hover:bg-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)] active:scale-[0.98]',
    ghost: 'bg-transparent text-neutral-400 hover:text-neutral-200 hover:bg-white/5',
    neutral: 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700',
    white: 'bg-neutral-100 text-neutral-950 hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.1)] active:scale-95'
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={`
        px-6 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
