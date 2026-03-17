'use client';

import type { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { WorkspaceProvider } from '@/contexts/workspace-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </WorkspaceProvider>
  );
}
