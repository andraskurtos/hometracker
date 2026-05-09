import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
}

export const Checkbox = ({ checked, onChange, className = '' }: CheckboxProps) => {
  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`
        w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer
        ${checked 
          ? 'bg-emerald-500 border-emerald-500 text-neutral-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
          : 'border-neutral-700 bg-neutral-800 hover:border-neutral-500'}
        ${className}
      `}
    >
      {checked && <Check size={18} strokeWidth={4} className="animate-in zoom-in duration-200" />}
    </div>
  );
};
