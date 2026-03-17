'use client';

import type { DocumentaryAnalysis } from '@/lib/ai/schemas/documentary';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

interface EditorialSectionProps {
  data: DocumentaryAnalysis['editorialNotes'] | undefined;
}

export function EditorialSection({ data }: EditorialSectionProps) {
  if (!data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-2">Narrative Threads</h4>
        <ul className="list-disc pl-5 space-y-1">
          {data.narrativeThreads.map((thread, i) => (
            <li key={i} className="text-sm">
              {thread}
            </li>
          ))}
        </ul>
      </div>

      <Separator />

      <div>
        <h4 className="text-sm font-semibold mb-2">Missing Perspectives</h4>
        <ul className="list-disc pl-5 space-y-1">
          {data.missingPerspectives.map((perspective, i) => (
            <li key={i} className="text-sm text-muted-foreground">
              {perspective}
            </li>
          ))}
        </ul>
      </div>

      <Separator />

      <div>
        <h4 className="text-sm font-semibold mb-2">Suggested Structure</h4>
        <p className="text-sm">{data.suggestedStructure}</p>
      </div>
    </div>
  );
}
