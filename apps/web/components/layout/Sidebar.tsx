'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Building2,
  FileCheck,
  Users,
  Settings,
  Package,
  ShoppingCart,
  ShoppingBag,
  UserCheck,
  Hammer,
  HelpCircle,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const isPlatformAdmin = user.isPlatformAdmin;

  return (
    <aside className="w-64 border-r border-border bg-card/40 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {isPlatformAdmin ? (
          <>
            <div>
              <nav className="space-y-1">
                <Link
                  href="/admin/dashboard"
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname === '/admin/dashboard'
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  )}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </nav>
            </div>

            <div>
              <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Management
              </h2>
              <nav className="space-y-1">
                {[
                  { name: 'Companies', href: '/admin/companies', icon: Building2 },
                  { name: 'Users', href: '/admin/users', icon: Users },
                  { name: 'Access Requests', href: '/admin/access-requests', icon: FileCheck },
                ].map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={clsx(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                System
              </h2>
              <nav className="space-y-1">
                <Link
                  href="/admin/activity"
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname === '/admin/activity'
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  )}
                >
                  <Hammer className="h-4 w-4" />
                  Activity
                </Link>
              </nav>
            </div>
          </>
        ) : (
          <>
            <div>
              <nav className="space-y-1">
                <Link
                  href="/dashboard"
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname === '/dashboard'
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  )}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </nav>
            </div>

            <div>
              <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                <span>Business</span>
                <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">Soon</span>
              </h2>
              <nav className="space-y-1 opacity-60 pointer-events-none">
                {[
                  { name: 'Inventory', icon: Package },
                  { name: 'Sales', icon: ShoppingCart },
                  { name: 'Purchases', icon: ShoppingBag },
                  { name: 'Customers', icon: UserCheck },
                  { name: 'Suppliers', icon: Building2 },
                  { name: 'Workers', icon: Hammer },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.name}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </div>
                  );
                })}
              </nav>
            </div>

            {user.activeMembership?.role === 'OWNER' && (
              <div>
                <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Company
                </h2>
                <nav className="space-y-1">
                  {[
                    { name: 'Users', href: '/settings/users', icon: Users },
                    { name: 'Settings', href: '/settings/company', icon: Settings },
                  ].map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={clsx(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}
          </>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5 text-primary" />
          FurnitureOS v1.5
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/80">
          Admin & Client Access Management
        </p>
      </div>
    </aside>
  );
}
