'use client';

import { Card, CardHeader, CardContent, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SuggestionCardProps {
  sceneHeading: string | null;
  characterName: string | null;
  originalText: string;
  rewriteText: string;
  weaknessCategory: string;
  weaknessLabel: string;
  index: number;
  animate?: boolean;
}

export function SuggestionCard({
  sceneHeading,
  characterName,
  originalText,
  rewriteText,
  weaknessLabel,
  index,
  animate = false,
}: SuggestionCardProps) {
  const truncatedLabel = weaknessLabel.length > 40
    ? weaknessLabel.slice(0, 40) + '...'
    : weaknessLabel;

  return (
    <Card
      role="article"
      aria-label={`Suggestion ${index + 1}: ${weaknessLabel}`}
      className={animate ? 'animate-in fade-in-0 slide-in-from-bottom-2 duration-300' : ''}
    >
      <CardHeader>
        <Badge variant="secondary" title={weaknessLabel}>
          {truncatedLabel}
        </Badge>
        <CardAction>
          {sceneHeading && (
            <span className="text-sm text-muted-foreground">
              {characterName && <span className="font-semibold">{characterName} - </span>}
              {sceneHeading}
            </span>
          )}
          {!sceneHeading && characterName && (
            <span className="text-sm text-muted-foreground font-semibold">{characterName}</span>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Original
          </p>
          <div className="bg-muted rounded-md p-4">
            <p className="text-sm">{originalText}</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Suggested Rewrite
          </p>
          <div className="bg-primary/5 rounded-md p-4 border border-primary/10">
            <p className="text-sm">{rewriteText}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
