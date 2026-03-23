'use client';

import { Card, CardHeader, CardContent, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DiffDisplay } from '@/components/diff-display';

interface SuggestionCardProps {
  id: string;
  sceneHeading: string | null;
  characterName: string | null;
  originalText: string;
  rewriteText: string;
  weaknessCategory: string;
  weaknessLabel: string;
  status: 'pending' | 'accepted' | 'rejected';
  index: number;
  animate?: boolean;
  isRegenerating?: boolean;
  onStatusChange: (id: string, status: 'pending' | 'accepted' | 'rejected') => void;
  onRegenerate: (id: string) => void;
}

export function SuggestionCard({
  id,
  sceneHeading,
  characterName,
  originalText,
  rewriteText,
  weaknessLabel,
  status,
  index,
  animate = false,
  isRegenerating = false,
  onStatusChange,
  onRegenerate,
}: SuggestionCardProps) {
  const truncatedLabel = weaknessLabel.length > 40
    ? weaknessLabel.slice(0, 40) + '...'
    : weaknessLabel;

  const disabled = isRegenerating;

  return (
    <Card
      role="article"
      aria-label={`Suggestion ${index + 1}: ${weaknessLabel}`}
      className={cn(
        animate ? 'animate-in fade-in-0 slide-in-from-bottom-2 duration-300' : '',
        status === 'accepted' && 'border-green-500/30',
        status === 'rejected' && 'border-red-500/30 opacity-60',
      )}
    >
      <CardHeader>
        <Badge variant="secondary" title={weaknessLabel}>
          {truncatedLabel}
        </Badge>
        <CardAction>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onStatusChange(id, status === 'accepted' ? 'pending' : 'accepted')}
              className={cn(
                'inline-flex items-center justify-center rounded-md h-8 w-8 transition-colors',
                status === 'accepted'
                  ? 'bg-green-500/20 text-green-600'
                  : 'hover:bg-muted text-muted-foreground',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
              aria-label="Accept suggestion"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onStatusChange(id, status === 'rejected' ? 'pending' : 'rejected')}
              className={cn(
                'inline-flex items-center justify-center rounded-md h-8 w-8 transition-colors',
                status === 'rejected'
                  ? 'bg-red-500/20 text-red-600'
                  : 'hover:bg-muted text-muted-foreground',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
              aria-label="Reject suggestion"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRegenerate(id)}
              className={cn(
                'inline-flex items-center justify-center rounded-md h-8 w-8 transition-colors',
                'hover:bg-muted text-muted-foreground',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
              aria-label="Regenerate suggestion"
            >
              <RefreshCw className={cn('h-4 w-4', isRegenerating && 'animate-spin')} />
            </button>
          </div>
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
      <CardContent>
        <DiffDisplay original={originalText} rewrite={rewriteText} />
      </CardContent>
    </Card>
  );
}
