'use client';
import { useMemo } from 'react';
import { applyAcceptedRewrites } from '@/lib/script-preview-utils';

interface ScriptPreviewProps {
  scriptText: string;
  suggestions: Array<{ originalText: string; rewriteText: string; status: string }>;
}

export function ScriptPreview({ scriptText, suggestions }: ScriptPreviewProps) {
  const previewText = useMemo(
    () => applyAcceptedRewrites(scriptText, suggestions),
    [scriptText, suggestions]
  );

  const acceptedCount = suggestions.filter(s => s.status === 'accepted').length;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold">Script Preview</h3>
        {acceptedCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {acceptedCount} revision{acceptedCount !== 1 ? 's' : ''} applied
          </span>
        )}
      </div>
      <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
          {previewText}
        </pre>
      </div>
    </div>
  );
}
