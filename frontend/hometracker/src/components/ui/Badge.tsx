import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'blue' | 'red' | 'neutral' | 'purple';
  icon?: React.ReactNode;
  className?: string;
}

const Badge = ({ 
  children, 
  variant = 'emerald', 
  icon, 
  className = '' 
}: BadgeProps) => {
  const variants = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    neutral: 'bg-neutral-800 border-neutral-700 text-neutral-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400'
  };

  return (
    <span className={`
      px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5 w-fit
      ${variants[variant]}
      ${className}
    `}>
      {icon}
      {children}
    </span>
  );
};

export default Badge;
