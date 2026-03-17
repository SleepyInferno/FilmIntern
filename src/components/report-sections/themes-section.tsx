'use client';

import type { DocumentaryAnalysis } from '@/lib/ai/schemas/documentary';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

interface ThemesSectionProps {
  data: DocumentaryAnalysis['recurringThemes'] | undefined;
}

function frequencyBadge(frequency: string) {
  switch (frequency) {
    case 'dominant':
      return (
        <Badge className="bg-amber-600 text-white hover:bg-amber-600/80">
          {frequency}
        </Badge>
      );
    case 'recurring':
      return <Badge variant="secondary">{frequency}</Badge>;
    case 'emerging':
      return <Badge variant="outline">{frequency}</Badge>;
    default:
      return <Badge variant="outline">{frequency}</Badge>;
  }
}

export function ThemesSection({ data }: ThemesSectionProps) {
  if (!data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <Accordion>
      {data.map((theme, i) => (
        <AccordionItem key={i} value={`theme-${i}`}>
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              {theme.theme}
              {frequencyBadge(theme.frequency)}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm mb-3">{theme.description}</p>
            <div className="space-y-2">
              {theme.evidence.map((evidence, j) => (
                <div
                  key={j}
                  className="border-l-2 border-muted pl-4 italic text-sm"
                >
                  &ldquo;{evidence}&rdquo;
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
