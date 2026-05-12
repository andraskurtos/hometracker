import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  variant?: 'neutral' | 'emerald' | 'red' | 'blue';
  className?: string;
  onClick?: () => void;
  trend?: {
    value: string | number;
    isPositive?: boolean;
  };
}

export const StatCard = ({
  label,
  value,
  icon,
  description,
  variant = 'neutral',
  className = '',
  onClick,
  trend
}: StatCardProps) => {
  const variantClasses = {
    neutral: 'bg-neutral-950/40 border-neutral-800',
    emerald: 'bg-emerald-500/5 border-emerald-500/20',
    red: 'bg-red-500/5 border-red-500/20',
    blue: 'bg-blue-500/5 border-blue-500/20'
  };

  const textVariantClasses = {
    neutral: 'text-neutral-100',
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    blue: 'text-blue-400'
  };

  return (
    <Card 
      padding="p-4" 
      className={`
        flex flex-col gap-1 transition-all
        ${variantClasses[variant]}
        ${onClick ? 'cursor-pointer hover:border-emerald-500/40 hover:bg-emerald-500/10' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 truncate">
          {label}
        </span>
        {icon && <div className="text-neutral-500">{icon}</div>}
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-black ${textVariantClasses[variant]}`}>
          {value}
        </span>
        {trend && (
          <span className={`text-[10px] font-bold ${trend.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend.value}
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
          {description}
        </p>
      )}
    </Card>
  );
};

export default StatCard;
