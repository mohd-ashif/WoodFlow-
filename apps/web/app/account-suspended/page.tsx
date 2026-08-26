'use client';

import React from 'react';
import { useAuth } from '../../components/providers/AuthProvider';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { ShieldAlert, LogOut } from 'lucide-react';

export default function AccountSuspendedPage() {
  const { logout, user } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md glass-panel relative z-10 border-rose-500/20 shadow-2xl bg-black/40 backdrop-blur-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-inner">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Workspace Suspended</CardTitle>
          <CardDescription className="text-rose-400/80 font-medium mt-1">
            Access Restricted for {user?.activeMembership?.company?.name || 'Your Company'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 text-center space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your company workspace account has been suspended by the platform administrator. 
            All access to company inventory, sales, settings, and business modules is currently blocked.
          </p>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-300">
            Please contact the system administrator or your company owner to resolve this suspension.
          </div>
        </CardContent>

        <CardFooter className="text-center pt-2 flex flex-col gap-2">
          <Button 
            variant="outline" 
            onClick={logout} 
            className="w-full gap-2 text-muted-foreground border-border hover:bg-secondary/80 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Logout from Workspace
          </Button>
          <p className="text-[10px] text-muted-foreground/60 mt-2">
            Logged in as {user?.email}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
