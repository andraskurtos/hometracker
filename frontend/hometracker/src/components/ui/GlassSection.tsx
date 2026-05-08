import React from 'react';

interface GlassSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2;
}

const GlassSection = ({ 
  title, 
  icon, 
  children, 
  className = '', 
  columns = 2 
}: GlassSectionProps) => {
  return (
    <div className={`w-full bg-neutral-900/30 border border-neutral-800/40 rounded-2xl p-6 backdrop-blur-sm ${className}`}>
      <div className="flex items-center gap-2 mb-6 text-neutral-400">
        {icon}
        <h3 className="font-semibold text-sm uppercase tracking-widest">{title}</h3>
      </div>
      <div className={`grid grid-cols-1 ${columns === 2 ? 'md:grid-cols-2' : ''} gap-6`}>
        {children}
      </div>
    </div>
  );
};

export default GlassSection;
