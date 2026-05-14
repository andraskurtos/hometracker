interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'emerald' | 'neutral';
  className?: string;
}

export const Spinner = ({ 
  size = 'md', 
  variant = 'emerald', 
  className = '' 
}: SpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4'
  };

  const variantClasses = {
    emerald: 'border-emerald-500/20 border-t-emerald-500',
    neutral: 'border-neutral-800 border-t-neutral-400'
  };

  return (
    <div 
      className={`
        rounded-full animate-spin
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      role="status"
      aria-label="loading"
    />
  );
};

export default Spinner;
