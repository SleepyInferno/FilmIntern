'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ContentPreviewProps {
  text: string;
  metadata: {
    wordCount: number;
    lineCount: number;
    format: string;
    filename?: string;
    size?: number;
  };
}

export function ContentPreview({ text, metadata }: ContentPreviewProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{metadata.wordCount} words</Badge>
          <Badge variant="outline">{metadata.lineCount} lines</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted rounded-md p-4 max-h-[400px] overflow-y-auto">
          <pre className="font-mono text-sm whitespace-pre-wrap leading-relaxed">
            {text}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
