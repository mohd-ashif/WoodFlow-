'use client';

import { useEffect } from 'react';
import { useAuth } from '../components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.isPlatformAdmin) {
        router.push('/admin/dashboard');
      } else if (user.activeMembership) {
        router.push('/dashboard');
      } else {
        router.push('/access-request');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span>Loading FurnitureOS...</span>
      </div>
    </div>
  );
}
