import { ArrowLeft } from 'lucide-react';

interface ReturnButtonProps {
  onClick: () => void;
  label: string;
  className?: string;
}

export const ReturnButton = ({ onClick, label, className = '' }: ReturnButtonProps) => {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 text-neutral-500 hover:text-neutral-200 transition-colors group w-fit ${className}`}
    >
      <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
      <span>{label}</span>
    </button>
  );
};
