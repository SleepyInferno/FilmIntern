'use client';

import { Badge } from '@/components/ui/badge';
import { ScoreBadge } from './score-badge';

interface WorkspaceHeaderProps {
  title: string;
  projectType: string;
  score: number | undefined;
}

export function WorkspaceHeader({ title, projectType, score }: WorkspaceHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <Badge variant="default">{projectType}</Badge>
      <ScoreBadge score={score} />
    </div>
  );
}
