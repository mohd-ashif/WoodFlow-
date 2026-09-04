'use client';

import React from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useLayout } from './LayoutContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LogOut, User, Building2, Menu, X } from 'lucide-react';

import { GlobalSearch } from '../common/GlobalSearch';
import { NotificationCenter } from '../common/NotificationCenter';

export function Navbar() {
  const { user, logout } = useAuth();
  const { isMobileOpen, toggleMobileMenu } = useLayout();

  const isPlatformAdmin = user?.isPlatformAdmin;
  const activeCompany = user?.activeMembership?.company;
  const role = user?.activeMembership?.role;

  return (
    <header className="h-16 shrink-0 z-40 flex w-full items-center justify-between border-b border-border bg-card/80 px-3 sm:px-4 md:px-6 backdrop-blur-md">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Drawer Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
          className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-semibold tracking-tight text-foreground flex items-center gap-1.5 truncate">
            {isPlatformAdmin ? (
              <>
                <span>FurnitureOS</span> <Badge variant="info" className="hidden sm:inline-flex">Admin</Badge>
              </>
            ) : activeCompany ? (
              <>
                <span className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">{activeCompany.name}</span>
                {role && <Badge variant="default" className="hidden sm:inline-flex">{role.replace('_', ' ')}</Badge>}
              </>
            ) : (
              'FurnitureOS'
            )}
          </h1>
        </div>

        {/* Global Search Component */}
        <div className="hidden sm:block">
          <GlobalSearch />
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Global Search Mobile Icon toggle */}
        <div className="sm:hidden">
          <GlobalSearch />
        </div>

        {/* Notification Center Popover */}
        <NotificationCenter />

        {user ? (
          <div className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-border bg-secondary/30 px-2.5 py-1 text-xs font-medium text-foreground">
            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate max-w-[80px] sm:max-w-[120px] md:max-w-none">{user.name}</span>
            <span className="text-muted-foreground hidden lg:inline">({user.email})</span>
          </div>
        ) : (
          <div className="h-7 w-20 sm:w-32 rounded-full bg-secondary/30 animate-pulse" />
        )}

        <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 text-muted-foreground hover:text-foreground px-2 sm:px-3">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
