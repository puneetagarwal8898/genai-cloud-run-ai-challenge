import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
  label?: string;
  size?: 'sm' | 'md';
  position?: 'top' | 'bottom' | 'auto';
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  text,
  label,
  size = 'sm',
  position = 'auto',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove: boolean } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 250; // approximate width of tooltip box
    const tooltipHeight = 80;

    // Check if there's enough space above (need at least tooltipHeight + 20px)
    let placeAbove = true;
    if (position === 'bottom') {
      placeAbove = false;
    } else if (position === 'top') {
      placeAbove = true;
    } else {
      // auto: place below if near the top of viewport (< 100px from top)
      placeAbove = rect.top > 110;
    }

    // Calculate vertical top
    const top = placeAbove
      ? rect.top - 8 // We will use transform translateY(-100%) in CSS
      : rect.bottom + 8;

    // Calculate horizontal center, clamped to screen edges
    const center = rect.left + rect.width / 2;
    const halfWidth = tooltipWidth / 2;
    const minLeft = 16 + halfWidth;
    const maxLeft = window.innerWidth - 16 - halfWidth;
    const clampedCenter = Math.max(minLeft, Math.min(maxLeft, center));

    setCoords({
      top,
      left: clampedCenter,
      placeAbove
    });
  }, [position]);

  const showTooltip = () => {
    updatePosition();
    setIsVisible(true);
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  // Keep position accurate on window resize or scroll when visible
  useEffect(() => {
    if (!isVisible) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, updatePosition]);

  const iconDimension = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <span className={`inline-flex items-center align-middle ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isVisible) {
            hideTooltip();
          } else {
            showTooltip();
          }
        }}
        aria-label={label || text}
        className="rounded-full p-0.5 transition opacity-60 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-amber-500/50 cursor-pointer inline-flex items-center justify-center text-current"
        style={{ color: 'var(--text-muted)' }}
      >
        <Info className={iconDimension} />
      </button>

      {isVisible && coords && typeof document !== 'undefined' &&
        createPortal(
          <div
            role="tooltip"
            className="fixed pointer-events-none transition-opacity duration-150 animate-in fade-in"
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: coords.placeAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
              width: '240px',
              maxWidth: 'calc(100vw - 32px)',
              zIndex: 999999, // Guarantees it is always on top of headers, overlays, and windows
              padding: '10px 12px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card-elevated)',
              color: 'var(--text-primary)',
              boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.35), 0 4px 12px -2px rgba(0, 0, 0, 0.2)'
            }}
          >
            {label && (
              <div className="font-semibold text-xs mb-1" style={{ color: 'var(--accent)' }}>
                {label}
              </div>
            )}
            <p className="leading-relaxed text-[11px] font-normal" style={{ color: 'var(--text-secondary)' }}>
              {text}
            </p>
          </div>,
          document.body
        )}
    </span>
  );
};
