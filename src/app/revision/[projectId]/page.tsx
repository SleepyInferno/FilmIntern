'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SuggestionGenerationPanel } from '@/components/suggestion-generation-panel';
import { SuggestionList } from '@/components/suggestion-list';
import type { SuggestionRow } from '@/lib/db';

interface ProjectData {
  id: string;
  title: string;
  projectType: string;
  analysisData: Record<string, unknown> | null;
}

export default function RevisionPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [streamingCurrent, setStreamingCurrent] = useState(0);
  const [streamingTotal, setStreamingTotal] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    async function loadProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (res.ok) {
          setProject(await res.json());
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [projectId]);

  // Load existing suggestions after project loads
  useEffect(() => {
    if (!project || !project.analysisData) return;

    async function loadSuggestions() {
      try {
        const res = await fetch(`/api/projects/${projectId}/suggestions`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch {
        // Silently fail - suggestions will be empty
      } finally {
        setSuggestionsLoaded(true);
      }
    }

    loadSuggestions();
  }, [project, projectId]);

  const handleGenerate = useCallback(async (count: number) => {
    setIsGenerating(true);
    setStreamingTotal(count);
    setStreamingCurrent(0);
    setSuggestions([]);
    setFailedCount(0);
    setGenerationError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Generation failed' }));
        setGenerationError(errorData.error || 'Generation failed');
        setIsGenerating(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setGenerationError('Stream not available');
        setIsGenerating(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let currentCount = 0;
      let currentFailed = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.error) {
              currentFailed++;
              setFailedCount(currentFailed);
            } else {
              currentCount++;
              setStreamingCurrent(currentCount);
              setSuggestions((prev) => [...prev, parsed as SuggestionRow]);
            }
          } catch {
            // Skip malformed NDJSON lines
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          if (parsed.error) {
            currentFailed++;
            setFailedCount(currentFailed);
          } else {
            currentCount++;
            setStreamingCurrent(currentCount);
            setSuggestions((prev) => [...prev, parsed as SuggestionRow]);
          }
        } catch {
          // Skip malformed final line
        }
      }
    } catch {
      setGenerationError('Suggestion generation failed. Check your AI provider settings and try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [projectId]);

  const handleRegenerate = useCallback((count: number) => {
    handleGenerate(count);
  }, [handleGenerate]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-[200px]" />
          <Skeleton className="h-5 w-[100px]" />
        </div>
        <Skeleton className="h-[140px] w-full rounded-lg" />
        <Skeleton className="h-[140px] w-full rounded-lg" />
        <Skeleton className="h-[140px] w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-24 space-y-4">
        <p className="text-muted-foreground">
          Could not load project. Check your connection and try again.
        </p>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Back to workspace
        </Link>
      </div>
    );
  }

  if (project && !project.analysisData) {
    return (
      <div className="text-center py-24 space-y-4">
        <h2 className="text-xl font-semibold">Analysis not yet completed</h2>
        <p className="text-muted-foreground">
          Run an analysis on this project first, then return here to review and
          revise your script.
        </p>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Back to workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/" aria-label="Back to workspace">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-semibold">{project?.title}</h1>
      </div>

      {!suggestionsLoaded ? (
        <>
          <Skeleton className="h-[140px] w-full rounded-lg" />
          <Skeleton className="h-[140px] w-full rounded-lg" />
          <Skeleton className="h-[140px] w-full rounded-lg" />
        </>
      ) : suggestions.length > 0 && !isGenerating ? (
        <>
          <SuggestionList
            suggestions={suggestions}
            isStreaming={false}
            streamingCurrent={0}
            streamingTotal={0}
            error={generationError}
            failedCount={failedCount}
          />
          <SuggestionGenerationPanel
            hasSuggestions={true}
            isGenerating={false}
            onGenerate={handleGenerate}
            onRegenerate={handleRegenerate}
          />
        </>
      ) : (
        <>
          <SuggestionGenerationPanel
            hasSuggestions={suggestions.length > 0}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
            onRegenerate={handleRegenerate}
          />
          <SuggestionList
            suggestions={suggestions}
            isStreaming={isGenerating}
            streamingCurrent={streamingCurrent}
            streamingTotal={streamingTotal}
            error={generationError}
            failedCount={failedCount}
          />
        </>
      )}

      <Card role="region" aria-label="Review and export tools">
        <CardContent className="py-12 text-center text-muted-foreground">
          Review and export tools will appear here
        </CardContent>
      </Card>
    </div>
  );
}
