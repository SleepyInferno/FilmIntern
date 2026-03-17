'use client';

import type { DocumentaryAnalysis } from '@/lib/ai/schemas/documentary';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface SummarySectionProps {
  data: DocumentaryAnalysis['summary'] | undefined;
}

export function SummarySection({ data }: SummarySectionProps) {
  if (!data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed">{data.overview}</p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{data.intervieweeCount} speakers</Badge>
        <Badge variant="outline">{data.totalQuotesExtracted} quotes</Badge>
        <Badge variant="outline">{data.dominantThemes.length} themes</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {data.dominantThemes.map((theme) => (
          <Badge key={theme} variant="secondary">
            {theme}
          </Badge>
        ))}
      </div>
    </div>
  );
}
