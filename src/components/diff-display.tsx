'use client';
import { useMemo } from 'react';
import { computeWordDiff } from '@/lib/diff-utils';

interface DiffDisplayProps {
  original: string;
  rewrite: string;
}

export function DiffDisplay({ original, rewrite }: DiffDisplayProps) {
  const changes = useMemo(() => computeWordDiff(original, rewrite), [original, rewrite]);

  return (
    <div className="bg-muted rounded-md p-4">
      <p className="text-sm leading-relaxed">
        {changes.map((change, i) => {
          if (change.removed) {
            return (
              <span key={i} className="bg-red-500/15 text-red-600 dark:text-red-400 line-through decoration-red-400/50">
                {change.value}
              </span>
            );
          }
          if (change.added) {
            return (
              <span key={i} className="bg-green-500/15 text-green-600 dark:text-green-400 font-medium">
                {change.value}
              </span>
            );
          }
          return <span key={i}>{change.value}</span>;
        })}
      </p>
    </div>
  );
}
