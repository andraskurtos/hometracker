import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card = ({ 
  children, 
  className = '', 
  hoverable = false, 
  padding = 'large' 
}: CardProps) => {
  const paddings = {
    none: '',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  return (
    <div className={`
      bg-neutral-900/40 border border-neutral-800/60 backdrop-blur-md rounded-3xl shadow-xl 
      ${hoverable ? 'hover:bg-neutral-900/60 hover:border-neutral-700/60 transition-all duration-300' : ''}
      ${paddings[padding]}
      ${className}
    `}>
      {children}
    </div>
  );
};
