'use client';

import { Badge } from '@/components/ui/badge';

const GREEN_VALUES = new Set([
  'strong', 'compelling', 'sharp', 'high', 'scroll-stopping', 'crystal-clear',
  'must-use', 'hero-quote', 'memorable', 'tight', 'multi-season', 'emotion-led',
  'dominant', 'unified', 'on-message', 'highly-quotable',
]);

const SECONDARY_VALUES = new Set([
  'adequate', 'serviceable', 'moderate', 'mostly-clear', 'well-paced',
  'limited-series', 'balanced', 'mostly-consistent', 'partially-aligned', 'recurring',
]);

const DESTRUCTIVE_VALUES = new Set([
  'weak', 'needs-work', 'underdeveloped', 'limited', 'niche', 'muddled',
  'unclear', 'slow', 'uneven', 'questionable', 'mixed-signals', 'contradictory',
  'off-message', 'needs-coaching', 'flat',
]);

const MUTED_VALUES = new Set(['missing', 'none', 'buried']);

export function EffectivenessBadge({ value }: { value: string }) {
  if (GREEN_VALUES.has(value)) {
    return (
      <Badge className="bg-green-600 text-white hover:bg-green-600/80">
        {value}
      </Badge>
    );
  }
  if (SECONDARY_VALUES.has(value)) {
    return <Badge variant="secondary">{value}</Badge>;
  }
  if (DESTRUCTIVE_VALUES.has(value)) {
    return <Badge variant="destructive">{value}</Badge>;
  }
  if (MUTED_VALUES.has(value)) {
    return (
      <Badge className="bg-muted-foreground text-white hover:bg-muted-foreground/80">
        {value}
      </Badge>
    );
  }
  return <Badge variant="outline">{value}</Badge>;
}
