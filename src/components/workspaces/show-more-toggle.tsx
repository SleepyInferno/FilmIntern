'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';

interface ShowMoreToggleProps {
  totalCount: number;
  visibleCount: number;
  expanded: boolean;
  onToggle: () => void;
}

export function ShowMoreToggle({ totalCount, visibleCount, expanded, onToggle }: ShowMoreToggleProps) {
  if (totalCount <= visibleCount) return null;

  return expanded ? (
    <button
      className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
      onClick={onToggle}
    >
      Show less <ChevronUp className="h-3 w-3" />
    </button>
  ) : (
    <button
      className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
      onClick={onToggle}
    >
      Show {totalCount - visibleCount} more <ChevronDown className="h-3 w-3" />
    </button>
  );
}
