import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface ResponsiveIconButtonProps {
  id?: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
  showText?: boolean;
  active?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  style?: React.CSSProperties;
  activeStyle?: React.CSSProperties;
  inactiveStyle?: React.CSSProperties;
  badge?: React.ReactNode;
  ariaLabel?: string;
  autoDismissMs?: number; // Time before floating label disappears on mobile/touch
}

/**
 * ResponsiveIconButton
 * Displays an icon + text if showText is true.
 * If showText is false (or screen/container is constrained):
 * - Displays ONLY the icon with zero clipping.
 * - When hovered on desktop OR tapped on touch/mobile, a floating tooltip appears
 *   displaying the label (and optional description), auto-dismissing after autoDismissMs (default 2200ms).
 * - Tooltip is rendered via Portal and mathematically clamped to the screen boundaries so it NEVER clips.
 */
export const ResponsiveIconButton: React.FC<ResponsiveIconButtonProps> = ({
  id,
  icon,
  label,
  description,
  showText = true,
  active = false,
  onClick,
  className = '',
  style = {},
  activeStyle = {},
  inactiveStyle = {},
  badge,
  ariaLabel,
  autoDismissMs = 2200
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove: boolean } | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearDismissTimer = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  };

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const tooltipEstimatedWidth = 140;
    const placeAbove = rect.top > 80;

    const top = placeAbove ? rect.top - 8 : rect.bottom + 8;
    const center = rect.left + rect.width / 2;
    const halfWidth = tooltipEstimatedWidth / 2;
    const minLeft = 12 + halfWidth;
    const maxLeft = (typeof window !== 'undefined' ? window.innerWidth : 400) - 12 - halfWidth;
    const clampedLeft = Math.max(minLeft, Math.min(maxLeft, center));

    setCoords({
      top,
      left: clampedLeft,
      placeAbove
    });
  }, []);

  const triggerShow = useCallback(() => {
    // Only show floating tooltip if text is hidden OR on mobile tap
    if (!showText) {
      updatePosition();
      setShowTooltip(true);
      clearDismissTimer();
      dismissTimerRef.current = setTimeout(() => {
        setShowTooltip(false);
      }, autoDismissMs);
    }
  }, [showText, updatePosition, autoDismissMs]);

  const triggerHide = useCallback(() => {
    clearDismissTimer();
    setShowTooltip(false);
  }, []);

  useEffect(() => {
    return () => {
      clearDismissTimer();
    };
  }, []);

  // Update position on window scroll/resize if tooltip is visible
  useEffect(() => {
    if (!showTooltip) return;
    const handleRecalculate = () => updatePosition();
    window.addEventListener('resize', handleRecalculate);
    window.addEventListener('scroll', handleRecalculate, true);
    return () => {
      window.removeEventListener('resize', handleRecalculate);
      window.removeEventListener('scroll', handleRecalculate, true);
    };
  }, [showTooltip, updatePosition]);

  const mergedStyle = {
    ...style,
    ...(active ? activeStyle : inactiveStyle)
  };

  const fullAriaLabel = ariaLabel || (description ? `${label} — ${description}` : label);

  return (
    <>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        onClick={(e) => {
          triggerShow();
          if (onClick) onClick(e);
        }}
        onMouseEnter={triggerShow}
        onMouseLeave={triggerHide}
        onFocus={triggerShow}
        onBlur={triggerHide}
        aria-label={fullAriaLabel}
        title={showText ? undefined : fullAriaLabel}
        className={`relative inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 select-none ${className}`}
        style={mergedStyle}
      >
        <span className="shrink-0 flex items-center justify-center">{icon}</span>
        {showText && <span className="truncate whitespace-nowrap">{label}</span>}
        {badge}
      </button>

      {/* Floating Tooltip via Portal when text is not visible */}
      {!showText && showTooltip && coords && typeof document !== 'undefined' && createPortal(
        <div
          role="tooltip"
          className="fixed z-9999 pointer-events-none px-2.5 py-1.5 rounded-xl shadow-xl text-xs font-medium backdrop-blur-md border animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap text-center"
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            transform: coords.placeAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
            backgroundColor: 'var(--bg-card-elevated, #1f242d)',
            borderColor: 'var(--border-color, rgba(255,255,255,0.15))',
            color: 'var(--text-primary, #ffffff)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 0 10px var(--accent-glow, rgba(99, 102, 241, 0.2))'
          }}
        >
          <div className="font-semibold leading-tight">{label}</div>
          {description && (
            <div className="text-[10px] opacity-75 font-normal max-w-[200px] leading-tight mt-0.5 whitespace-normal">
              {description}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};
