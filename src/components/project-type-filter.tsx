'use client';

import { Film, Video, Briefcase, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ALL_TYPES = ['narrative', 'documentary', 'corporate', 'tv-episodic'] as const;

const TYPE_ICONS: Record<string, React.ReactNode> = {
  narrative: <Film size={13} aria-hidden="true" />,
  documentary: <Video size={13} aria-hidden="true" />,
  corporate: <Briefcase size={13} aria-hidden="true" />,
  'tv-episodic': <Tv size={13} aria-hidden="true" />,
};

const TYPE_LABELS: Record<string, string> = {
  narrative: 'Narrative',
  documentary: 'Documentary',
  corporate: 'Corporate',
  'tv-episodic': 'TV / Episodic',
};

interface ProjectTypeFilterProps {
  activeTypes: Set<string>;
  onToggleType: (type: string) => void;
  onToggleAll: () => void;
}

export function ProjectTypeFilter({ activeTypes, onToggleType, onToggleAll }: ProjectTypeFilterProps) {
  const allChecked = activeTypes.size === ALL_TYPES.length;

  return (
    <div className="px-4 py-2 border-b border-border">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filter</span>
      <div className="flex flex-col gap-1 mt-1">
        {/* All checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={onToggleAll}
            aria-label="Select all project types"
          />
          <span className={cn('text-xs', allChecked ? 'text-foreground' : 'text-muted-foreground')}>
            All
          </span>
        </label>

        {/* Individual type checkboxes */}
        {ALL_TYPES.map((type) => {
          const checked = activeTypes.has(type);
          return (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleType(type)}
              />
              {TYPE_ICONS[type]}
              <span className={cn('text-xs', checked ? 'text-foreground' : 'text-muted-foreground')}>
                {TYPE_LABELS[type]}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
