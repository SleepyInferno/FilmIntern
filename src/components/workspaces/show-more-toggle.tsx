'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';

export interface ShowMoreToggleProps {
  totalCount: number;
  visibleCount: number;
  expanded: boolean;
  onToggle: () => void;
}

export function ShowMoreToggle({ totalCount, visibleCount, expanded, onToggle }: ShowMoreToggleProps) {
  if (totalCount <= visibleCount) return null;
  return (
    <button
      className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
      onClick={onToggle}
    >
      {expanded ? (
        <>Show less <ChevronUp className="h-3 w-3" /></>
      ) : (
        <>Show {totalCount - visibleCount} more <ChevronDown className="h-3 w-3" /></>
      )}
    </button>
  );
}
