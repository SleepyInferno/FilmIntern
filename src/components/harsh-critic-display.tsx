'use client';

import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface HarshCriticDisplayProps {
  content: string;
  isStreaming: boolean;
}

export function HarshCriticDisplay({ content, isStreaming }: HarshCriticDisplayProps) {
  if (!content && isStreaming) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Running Industry Critic...</span>
        </CardContent>
      </Card>
    );
  }

  if (!content) return null;

  // Split content into sections by numbered headings like:
  // "1. Story Angle Under Pressure" or "## 1. Story Angle Under Pressure"
  const sections = content.split(/(?=(?:#{1,3}\s*)?\d{1,2}\.\s+)/).filter(Boolean);

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {sections.map((section, i) => {
          const lines = section.trim().split('\n');
          const heading = lines[0]?.replace(/^#{1,3}\s*/, '').trim() ?? '';
          const body = lines.slice(1).join('\n').trim();

          return (
            <div key={i}>
              {heading && (
                <h3 className="text-sm font-semibold text-foreground mb-2">{heading}</h3>
              )}
              {body && (
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  {body.split(/\n\n+/).map((paragraph, j) => (
                    <p key={j} className="mb-2 last:mb-0 leading-relaxed">
                      {paragraph.trim()}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-foreground/60 animate-pulse rounded-sm" />
        )}
      </CardContent>
    </Card>
  );
}
