'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FullRewritePanelProps {
  projectId: string;
  projectTitle: string;
  hasCriticAnalysis: boolean;
  scriptText: string;
}

export function FullRewritePanel({
  projectId,
  projectTitle,
  hasCriticAnalysis,
  scriptText,
}: FullRewritePanelProps) {
  const [rewriteText, setRewriteText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load previously saved rewrite on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/projects/${projectId}/rewrite`);
        if (res.ok) {
          const data = await res.json();
          if (data.fullRewrite) setRewriteText(data.fullRewrite);
        }
      } catch {
        // Silently fail
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, [projectId]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (isGenerating && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [rewriteText, isGenerating]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setRewriteText('');

    try {
      const res = await fetch(`/api/projects/${projectId}/rewrite`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Rewrite failed' }));
        setError(errData.error || 'Rewrite generation failed');
        setIsGenerating(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError('Stream not available');
        setIsGenerating(false);
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setRewriteText(accumulated);
      }

      // Save to DB
      if (accumulated) {
        await fetch(`/api/projects/${projectId}/rewrite`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullRewrite: accumulated }),
        });
      }
    } catch {
      setError('Rewrite generation failed. Check your AI provider settings and try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [projectId]);

  const handleExport = useCallback(async (format: 'pdf' | 'docx') => {
    const setExporting = format === 'pdf' ? setExportingPdf : setExportingDocx;
    setExporting(true);

    try {
      const res = await fetch('/api/export/revised-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          format,
          title: projectTitle,
          source: 'rewrite',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Export failed' }));
        console.error('Export error:', err.error);
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="(.+?)"/);
      const filename = match?.[1] ?? `${projectTitle}-rewrite.${format}`;

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

  if (!loaded) return null;

  return (
    <div className="space-y-4">
      {/* Generate / Regenerate controls */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Full Script Rewrite</h3>
            <p className="text-xs text-muted-foreground mt-1">
              AI rewrites your entire script based on the Harsh Critic analysis,
              preserving your story, characters, and structure.
            </p>
          </div>
        </div>

        {!hasCriticAnalysis && (
          <p className="text-xs text-amber-600">
            Run a Harsh Critic analysis first to enable full rewrite generation.
          </p>
        )}

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={!hasCriticAnalysis || isGenerating}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                Rewriting...
              </>
            ) : rewriteText ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Regenerate Rewrite
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Generate Full Rewrite
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Side-by-side view when rewrite exists */}
      {(rewriteText || isGenerating) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Original */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b">
              <h3 className="text-sm font-semibold">Original Script</h3>
            </div>
            <div className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {scriptText}
              </pre>
            </div>
          </div>

          {/* Rewrite */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">AI Rewrite</h3>
                {isGenerating && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </div>
              {rewriteText && !isGenerating && (
                <div className="flex gap-1">
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
              )}
            </div>
            <div ref={scrollRef} className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {rewriteText || 'Generating...'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
