'use client';

import { Badge } from '@/components/ui/badge';

export function ScoreBadge({ score }: { score: number | undefined }) {
  if (score === undefined) return null;

  return (
    <Badge className="bg-primary text-primary-foreground">
      {score.toFixed(1)} / 10
    </Badge>
  );
}
