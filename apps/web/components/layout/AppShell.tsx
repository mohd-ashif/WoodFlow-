'use client';

import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function AppShell({ children, scrollable = false }: { children: React.ReactNode; title?: string; scrollable?: boolean }) {
  return (
    <div className="h-screen h-[100dvh] w-full max-w-full flex flex-col overflow-hidden bg-background">
      <Navbar />
      <div className="flex flex-1 min-h-0 w-full max-w-full overflow-hidden">
        <Sidebar />
        <main className={`flex-1 min-w-0 min-h-0 flex flex-col p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 ${scrollable ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
