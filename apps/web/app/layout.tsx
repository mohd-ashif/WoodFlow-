import './globals.css';
import React from 'react';
import QueryProvider from '../components/providers/QueryProvider';
import { AuthProvider } from '../components/providers/AuthProvider';

export const metadata = {
  title: 'FurnitureOS - Multi-Tenant Furniture Management SaaS',
  description: 'Production-Ready SaaS Platform for Furniture Shop Management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground min-h-screen font-sans antialiased">
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
