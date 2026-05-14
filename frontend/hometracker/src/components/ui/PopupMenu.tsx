import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PopupMenuProps {
  children: React.ReactNode;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  className?: string;
}

export const PopupMenu = ({ children, onClose, anchorRef, className = '' }: PopupMenuProps) => {
  const [coords, setCoords] = useState<{ top: number, left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX
      });
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && 
          anchorRef.current && !anchorRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [anchorRef, onClose]);

  // Don't render until we have coordinates to avoid flickering at (0,0)
  if (!coords) return null;

  return createPortal(
    <div 
      ref={menuRef}
      style={{ 
        position: 'absolute', 
        top: `${coords.top}px`, 
        left: `${coords.left}px`,
        transform: 'translate(0, -100%)',
        marginTop: '-8px',
        zIndex: 9999
      }}
    >
      {/* 
         We wrap the children in an extra div so that the animation class (which often has its own transform)
         doesn't overwrite our positioning transform on the parent.
      */}
      <div className={className}>
        {children}
      </div>
    </div>,
    document.body
  );
};
