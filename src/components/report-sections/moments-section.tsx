'use client';

import type { DocumentaryAnalysis } from '@/lib/ai/schemas/documentary';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface MomentsSectionProps {
  data: DocumentaryAnalysis['keyMoments'] | undefined;
}

function typeBadgeClass(type: string): string {
  switch (type) {
    case 'turning-point':
      return 'bg-primary text-white hover:bg-primary/80';
    case 'emotional-peak':
      return 'bg-rose-500 text-white hover:bg-rose-500/80';
    case 'revelation':
      return 'bg-primary text-white hover:bg-primary/80';
    case 'contradiction':
      return 'bg-orange-500 text-white hover:bg-orange-500/80';
    case 'humor':
      return 'bg-emerald-500 text-white hover:bg-emerald-500/80';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function MomentsSection({ data }: MomentsSectionProps) {
  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((moment, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col gap-1 shrink-0">
            <Badge variant="outline">{moment.approximateLocation}</Badge>
            <Badge className={typeBadgeClass(moment.type)}>{moment.type}</Badge>
          </div>
          <div>
            <p className="text-base font-semibold">{moment.moment}</p>
            <p className="text-sm text-muted-foreground">
              {moment.significance}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
