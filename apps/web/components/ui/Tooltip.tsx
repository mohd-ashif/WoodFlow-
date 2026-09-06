'use client';

import React, { useState, useRef, useId, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delayMs?: number;
  disabled?: boolean;
}

/**
 * Portal-based, collision-aware Tooltip component.
 * Escapes all overflow clipping containers (tables, cards, scroll views)
 * by rendering directly to document.body via React Portal.
 * Automatically flips and repositions near viewport boundaries.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
  className,
  delayMs = 150,
  disabled = false,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; actualSide: string }>({
    top: -9999,
    left: -9999,
    actualSide: side,
  });

  const triggerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const id = useId();

  // Ensure portal target exists on client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const offset = 8;
    const padding = 12;

    let computedSide = side;

    // Auto-flip vertical sides if overflowing viewport
    if (computedSide === 'top' && triggerRect.top - tooltipRect.height - offset < padding) {
      computedSide = 'bottom';
    } else if (
      computedSide === 'bottom' &&
      triggerRect.bottom + tooltipRect.height + offset > viewportHeight - padding
    ) {
      computedSide = 'top';
    }

    // Auto-flip horizontal sides if overflowing viewport
    if (computedSide === 'left' && triggerRect.left - tooltipRect.width - offset < padding) {
      computedSide = 'right';
    } else if (
      computedSide === 'right' &&
      triggerRect.right + tooltipRect.width + offset > viewportWidth - padding
    ) {
      computedSide = 'left';
    }

    let top = 0;
    let left = 0;

    if (computedSide === 'top') {
      top = triggerRect.top - tooltipRect.height - offset;
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    } else if (computedSide === 'bottom') {
      top = triggerRect.bottom + offset;
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    } else if (computedSide === 'left') {
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      left = triggerRect.left - tooltipRect.width - offset;
    } else if (computedSide === 'right') {
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      left = triggerRect.right + offset;
    }

    // Clamp coordinates within visible screen boundary
    left = Math.max(padding, Math.min(left, viewportWidth - tooltipRect.width - padding));
    top = Math.max(padding, Math.min(top, viewportHeight - tooltipRect.height - padding));

    setCoords({ top, left, actualSide: computedSide });
  }, [side]);

  const showTooltip = useCallback(() => {
    if (disabled || !content) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, delayMs);
  }, [delayMs, disabled, content]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  // Update placement immediately when visible
  useLayoutEffect(() => {
    if (visible) {
      updatePosition();
    }
  }, [visible, updatePosition]);

  // Recalculate on scroll, resize, or escape key
  useEffect(() => {
    if (!visible) return;

    const handleScrollOrResize = () => updatePosition();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideTooltip();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, updatePosition, hideTooltip]);

  // Clean up timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!content || disabled) return children;

  return (
    <div
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocusCapture={showTooltip}
      onBlurCapture={hideTooltip}
    >
      {React.cloneElement(children, { 'aria-describedby': visible ? id : undefined })}

      {visible &&
        mounted &&
        createPortal(
          <div
            ref={tooltipRef}
            id={id}
            role="tooltip"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            className={clsx(
              'z-[9999] max-w-[240px] whitespace-normal break-words rounded-md px-2.5 py-1.5 text-[11px] font-medium leading-normal',
              'bg-foreground text-background shadow-lg border border-border/20 backdrop-blur-md',
              'animate-in fade-in zoom-in-95 duration-100 pointer-events-none select-none',
              className
            )}
          >
            {content}
          </div>,
          document.body
        )}
    </div>
  );
}

