'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { clsx } from 'clsx';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export interface AppIconProps extends React.SVGProps<SVGSVGElement> {
  name?: keyof typeof LucideIcons | string;
  icon?: LucideIcons.LucideIcon;
  size?: IconSize | number;
  className?: string;
  strokeWidth?: number;
}

const SIZE_MAP: Record<IconSize, number> = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  icon: IconComponent,
  size = 'md',
  className = '',
  strokeWidth = 2,
  ...props
}) => {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 18;

  let TargetIcon: LucideIcons.LucideIcon | null = IconComponent || null;

  if (!TargetIcon && name) {
    const iconName = name as keyof typeof LucideIcons;
    TargetIcon = (LucideIcons[iconName] as LucideIcons.LucideIcon) || LucideIcons.HelpCircle;
  }

  if (!TargetIcon) {
    TargetIcon = LucideIcons.HelpCircle;
  }

  return (
    <span className="inline-flex items-center justify-center shrink-0 leading-none select-none">
      <TargetIcon
        width={pixelSize}
        height={pixelSize}
        strokeWidth={strokeWidth}
        className={clsx('shrink-0 transition-colors', className)}
        {...(props as any)}
      />
    </span>
  );
};
