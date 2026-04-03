'use client';
import { useCallback, useMemo, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { applyAcceptedRewrites } from '@/lib/script-preview-utils';

interface ScriptPreviewProps {
  scriptText: string;
  suggestions: Array<{ originalText: string; rewriteText: string; status: string }>;
  projectId: string;
  projectTitle: string;
}

export function ScriptPreview({ scriptText, suggestions, projectId, projectTitle }: ScriptPreviewProps) {
  const previewText = useMemo(
    () => applyAcceptedRewrites(scriptText, suggestions),
    [scriptText, suggestions]
  );

  const acceptedCount = suggestions.filter(s => s.status === 'accepted').length;
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);

  const handleExport = useCallback(async (format: 'pdf' | 'docx') => {
    const setExporting = format === 'pdf' ? setExportingPdf : setExportingDocx;
    setExporting(true);

    try {
      const res = await fetch('/api/export/revised-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, format, title: projectTitle }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Export failed' }));
        console.error('Export error:', err.error);
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="(.+?)"/);
      const filename = match?.[1] ?? `revised-script.${format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  }, [projectId, projectTitle]);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold">Script Preview</h3>
        <div className="flex items-center gap-2">
          {acceptedCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {acceptedCount} revision{acceptedCount !== 1 ? 's' : ''} applied
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            disabled={exportingPdf}
            onClick={() => handleExport('pdf')}
          >
            {exportingPdf ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            disabled={exportingDocx}
            onClick={() => handleExport('docx')}
          >
            {exportingDocx ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            DOCX
          </Button>
        </div>
      </div>
      <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
          {previewText}
        </pre>
      </div>
    </div>
  );
}
