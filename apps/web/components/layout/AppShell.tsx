'use client';

import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="h-screen w-full max-w-full flex flex-col overflow-hidden bg-background">
      <Navbar />
      <div className="flex flex-1 min-h-0 w-full max-w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
