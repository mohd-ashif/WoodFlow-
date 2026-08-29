'use client';

import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <Navbar />
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
