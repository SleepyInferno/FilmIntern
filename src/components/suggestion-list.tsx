'use client';

import { Loader2 } from 'lucide-react';
import { SuggestionCard } from '@/components/suggestion-card';
import type { SuggestionRow } from '@/lib/db';

interface SuggestionListProps {
  suggestions: SuggestionRow[];
  isStreaming: boolean;
  streamingCurrent: number;
  streamingTotal: number;
  error: string | null;
  failedCount: number;
}

export function SuggestionList({
  suggestions,
  isStreaming,
  streamingCurrent,
  streamingTotal,
  error,
  failedCount,
}: SuggestionListProps) {
  if (error && suggestions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (suggestions.length === 0 && !isStreaming) {
    return null;
  }

  return (
    <div className="space-y-4">
      {suggestions.map((suggestion, i) => (
        <SuggestionCard
          key={suggestion.id}
          sceneHeading={suggestion.sceneHeading}
          characterName={suggestion.characterName}
          originalText={suggestion.originalText}
          rewriteText={suggestion.rewriteText}
          weaknessCategory={suggestion.weaknessCategory}
          weaknessLabel={suggestion.weaknessLabel}
          index={i}
          animate={isStreaming}
        />
      ))}

      {isStreaming && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-muted-foreground py-2"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating suggestion {streamingCurrent} of {streamingTotal}...
        </div>
      )}

      {!isStreaming && suggestions.length > 0 && failedCount === 0 && (
        <p className="text-sm text-muted-foreground">
          {suggestions.length} suggestions generated
        </p>
      )}

      {!isStreaming && suggestions.length > 0 && failedCount > 0 && (
        <p className="text-sm text-muted-foreground">
          {suggestions.length} of {suggestions.length + failedCount} suggestions generated. Some failed -- you can regenerate to try again.
        </p>
      )}
    </div>
  );
}
