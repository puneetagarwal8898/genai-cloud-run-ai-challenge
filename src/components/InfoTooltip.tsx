import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
  label?: string;
  size?: 'sm' | 'md';
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  text,
  label,
  size = 'sm',
  position = 'top',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Close when clicking outside (especially on mobile touch)
  useEffect(() => {
    if (!isVisible) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible]);

  const iconDimension = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }[position];

  return (
    <span
      ref={containerRef}
      className={`relative inline-flex items-center align-middle ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsVisible((prev) => !prev);
        }}
        aria-label={label || text}
        className="rounded-full p-0.5 transition opacity-65 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-amber-500/50 cursor-pointer inline-flex items-center justify-center text-current"
      >
        <Info className={iconDimension} />
      </button>

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 w-56 sm:w-64 p-2.5 text-xs rounded-xl shadow-xl border pointer-events-none transition-opacity duration-150 animate-in fade-in ${positionClasses}`}
          style={{
            backgroundColor: 'var(--bg-card-elevated)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
          }}
        >
          {label && (
            <div className="font-semibold mb-1" style={{ color: 'var(--accent)' }}>
              {label}
            </div>
          )}
          <p className="leading-relaxed opacity-90 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            {text}
          </p>
        </div>
      )}
    </span>
  );
};
