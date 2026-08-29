'use client';

import React from 'react';
import { useAuth } from '../providers/AuthProvider';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LogOut, User, Building2, ShieldAlert } from 'lucide-react';

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="h-16 shrink-0 z-40 flex w-full items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
              FurnitureOS
            </h1>
          </div>
        </div>
      </header>
    );
  }

  if (!user && !isLoading) return null;

  const isPlatformAdmin = user?.isPlatformAdmin;
  const activeCompany = user?.activeMembership?.company;
  const role = user?.activeMembership?.role;

  return (
    <header className="h-16 shrink-0 z-40 flex w-full items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            {isPlatformAdmin ? (
              <>
                FurnitureOS <Badge variant="info">Platform Admin</Badge>
              </>
            ) : activeCompany ? (
              <>
                {activeCompany.name}
                {role && <Badge variant="default">{role.replace('_', ' ')}</Badge>}
              </>
            ) : (
              'FurnitureOS'
            )}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/30 px-3 py-1.5 text-xs font-medium text-foreground">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{user.name}</span>
            <span className="text-muted-foreground">({user.email})</span>
          </div>
        ) : (
          <div className="h-7 w-32 rounded-full bg-secondary/30 animate-pulse" />
        )}

        <Button variant="ghost" size="sm" onClick={logout} className="gap-2 text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
