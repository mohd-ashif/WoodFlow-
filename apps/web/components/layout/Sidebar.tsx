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
  Clock,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  if (!user && !isLoading) return null;

  const isPlatformAdmin = user ? Boolean(user.isPlatformAdmin) : false;

  return (
    <aside className="w-64 shrink-0 h-full border-r border-border bg-card/40 flex flex-col justify-between overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-6">
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
              <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Inventory
              </h2>
              <nav className="space-y-1">
                {[
                  { name: 'Overview', href: '/inventory', icon: LayoutDashboard },
                  { name: 'Products', href: '/inventory/products', icon: Package },
                  { name: 'Categories', href: '/inventory/categories', icon: Building2 },
                  { name: 'Units', href: '/inventory/units', icon: FileCheck },
                  { name: 'Low Stock', href: '/inventory/low-stock', icon: HelpCircle },
                  { name: 'Out of Stock', href: '/inventory/out-of-stock', icon: HelpCircle },
                  { name: 'Stock Movements', href: '/inventory/movements', icon: Clock || Hammer },
                ].map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/inventory' && pathname.startsWith(item.href));
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

              <div className="mt-2 px-3">
                <Link
                  href="/inventory/products/new"
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  <span>+ Add Product</span>
                </Link>
              </div>
            </div>

            <div>
              <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                CRM & Contacts
              </h2>
              <nav className="space-y-1">
                {[
                  { name: 'Overview', href: '/crm', icon: LayoutDashboard, exact: true },
                  { name: 'Customers', href: '/crm/customers', icon: UserCheck, exact: false },
                  { name: 'Suppliers', href: '/crm/suppliers', icon: Building2, exact: false },
                  { name: 'Activities', href: '/crm/activities', icon: Clock, exact: false },
                  { name: 'Tags', href: '/crm/tags', aliasHref: '/crm/settings/tags', icon: Settings, exact: false },
                ].map((item) => {
                  let isActive = false;
                  if (item.exact) {
                    isActive = pathname === item.href || pathname === `${item.href}/dashboard`;
                  } else {
                    isActive = pathname === item.href || pathname.startsWith(`${item.href}/`) || (item.aliasHref ? pathname === item.aliasHref || pathname.startsWith(`${item.aliasHref}/`) : false);
                  }
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={clsx(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Sales & Invoicing
              </h2>
              <nav className="space-y-1">
                {[
                  { name: 'Sales Orders', href: '/sales', icon: ShoppingCart, exact: false },
                  { name: 'Invoices', href: '/invoices', icon: FileCheck, exact: false },
                ].map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={clsx(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Purchases & Suppliers
              </h2>
              <nav className="space-y-1">
                {[
                  { name: 'Purchases Overview', href: '/purchases/overview', icon: LayoutDashboard, exact: true },
                  { name: 'Purchase Orders', href: '/purchases', icon: ShoppingBag, exact: false },
                ].map((item) => {
                  const isActive = item.exact ? pathname === item.href : (pathname === item.href || (pathname.startsWith(`${item.href}/`) && !pathname.startsWith('/purchases/overview')));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={clsx(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Production & Workers
              </h2>
              <nav className="space-y-1">
                {[
                  { name: 'Overview', href: '/production', icon: LayoutDashboard, exact: true },
                  { name: 'Work Orders', href: '/work-orders', icon: Hammer, exact: false },
                  { name: 'Workers', href: '/workers', icon: Users, exact: false },
                  { name: 'My Work', href: '/my-work', icon: Clock, exact: false },
                ].map((item) => {
                  const isActive = item.exact ? pathname === item.href : (pathname === item.href || pathname.startsWith(`${item.href}/`));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={clsx(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>


            {(user ? user.activeMembership?.role === 'OWNER' : false) && (
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

      <div className="p-4 shrink-0 border-t border-border/40">
        <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            FurnitureOS v1.5
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/80">
            Admin & Client Access Management
          </p>
        </div>
      </div>
    </aside>
  );
}
