'use client';

import React from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { HelpCenterLayout } from '../../components/help/HelpCenterLayout';

export default function HelpPage() {
  return (
    <AppShell>
      <HelpCenterLayout />
    </AppShell>
  );
}
