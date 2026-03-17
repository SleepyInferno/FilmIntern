'use client';

import type { DocumentaryAnalysis } from '@/lib/ai/schemas/documentary';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface QuotesSectionProps {
  data: DocumentaryAnalysis['keyQuotes'] | undefined;
}

function usefulnessBorderClass(usefulness: string): string {
  switch (usefulness) {
    case 'must-use':
      return 'border-amber-600';
    case 'strong':
      return 'border-stone-400';
    case 'supporting':
      return 'border-stone-200';
    default:
      return 'border-stone-200';
  }
}

export function QuotesSection({ data }: QuotesSectionProps) {
  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((q, i) => (
        <div
          key={i}
          className={`border-l-[3px] pl-4 py-2 ${usefulnessBorderClass(q.usefulness)}`}
        >
          <p className="italic text-sm">&ldquo;{q.quote}&rdquo;</p>
          <p className="text-sm font-semibold mt-1">{q.speaker}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{q.context}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary">{q.category}</Badge>
            {q.usefulness === 'must-use' ? (
              <Badge className="bg-amber-600 text-white hover:bg-amber-600/80">
                {q.usefulness}
              </Badge>
            ) : q.usefulness === 'strong' ? (
              <Badge variant="secondary">{q.usefulness}</Badge>
            ) : (
              <Badge variant="outline">{q.usefulness}</Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
