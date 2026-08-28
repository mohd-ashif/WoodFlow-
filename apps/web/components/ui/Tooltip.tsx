'use client';

import React, { useState, useRef, useId } from 'react';
import { clsx } from 'clsx';

export interface TooltipProps {
  content: string;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

/**
 * Lightweight CSS tooltip that wraps a single child element.
 * Uses aria-describedby for accessibility.
 * No external dependencies — pure CSS positioning.
 */
export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  const sideClass = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[side];

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocusCapture={() => setVisible(true)}
      onBlurCapture={() => setVisible(false)}
    >
      {React.cloneElement(children, { 'aria-describedby': visible ? id : undefined })}
      {visible && (
        <div
          id={id}
          role="tooltip"
          className={clsx(
            'absolute z-50 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium',
            'bg-foreground/90 text-background shadow-md backdrop-blur-sm',
            'animate-in fade-in zoom-in-95 duration-100 pointer-events-none',
            sideClass,
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
