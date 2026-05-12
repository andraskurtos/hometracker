import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  className?: string;
  animate?: boolean;
}

export const PageLayout = ({
  children,
  maxWidth = '7xl',
  className = '',
  animate = true
}: PageLayoutProps) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <main 
      className={`
        w-full mx-auto px-4 md:px-6 py-8
        ${maxWidthClasses[maxWidth]}
        ${animate ? 'animate-in fade-in slide-in-from-bottom-4 duration-500' : ''}
        ${className}
      `}
    >
      {children}
    </main>
  );
};

export default PageLayout;
