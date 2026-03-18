'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { WorkspaceProvider } from '@/contexts/workspace-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" storageKey="theme" disableTransitionOnChange>
      <WorkspaceProvider>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </WorkspaceProvider>
    </ThemeProvider>
  );
}
