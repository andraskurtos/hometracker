import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ 
  label, 
  icon, 
  error, 
  className = '', 
  id,
  ...props 
}, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-neutral-500 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          className={`
            w-full py-3 bg-neutral-800/50 border rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none transition-all
            ${icon ? 'pl-11 pr-4' : 'px-4'}
            ${error 
              ? 'border-red-500/50 focus:ring-2 focus:ring-red-500/50 focus:border-red-500' 
              : 'border-neutral-700 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500'}
            ${className}
          `}
          {...props}
        />
      </div>
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
