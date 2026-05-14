import React from 'react';
import { User } from 'lucide-react';
import { getAssetUrl } from '../../utils/assetUtils';

interface AvatarProps {
  src?: string | null;
  firstName?: string;
  lastName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  borderColor?: string;
  fallbackIcon?: React.ReactNode;
  style?: React.CSSProperties;
}

export const Avatar = ({
  src,
  firstName,
  lastName,
  size = 'md',
  className = '',
  borderColor = 'border-neutral-800',
  fallbackIcon,
  style
}: AvatarProps) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[8px]',
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-24 h-24 text-xl',
    '2xl': 'w-32 h-32 text-2xl'
  };

  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase();
  const fullUrl = getAssetUrl(src);

  return (
    <div 
      className={`
        relative rounded-full overflow-hidden flex items-center justify-center shrink-0 border
        ${sizeClasses[size]}
        ${borderColor}
        ${className}
      `}
      style={style}
    >
      {fullUrl ? (
        <img 
          src={fullUrl} 
          alt={firstName ? `${firstName} ${lastName}` : 'User avatar'} 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-neutral-800 flex items-center justify-center font-black text-neutral-400">
          {initials || fallbackIcon || <User size={size === 'xs' ? 12 : size === 'sm' ? 16 : 20} />}
        </div>
      )}
    </div>
  );
};

export default Avatar;
