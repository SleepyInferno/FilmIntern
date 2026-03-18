'use client';

import { useState } from 'react';
import type React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface EvaluationCardProps {
  title: string;
  ready: boolean;
  children: React.ReactNode;
  className?: string;
}

export function EvaluationCard({ title, ready, children, className }: EvaluationCardProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Card className={cn(className)}>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <button aria-label={collapsed ? 'Expand card' : 'Collapse card'}>
            {collapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </CardAction>
      </CardHeader>
      {!collapsed && (
        <div className="overflow-hidden">
          <CardContent>
            {ready ? (
              children
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}
          </CardContent>
        </div>
      )}
    </Card>
  );
}
