'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/contexts/workspace-context';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import type { ImagePromptResult, ImagePrompt } from '@/app/api/image-prompts/generate/route';

function PromptCard({ prompt }: { prompt: ImagePrompt }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(prompt.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
              {prompt.scene}
            </p>
            <h3 className="font-semibold">{prompt.title}</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy Prompt'}
          </Button>
        </div>

        <p className="text-sm leading-relaxed text-foreground/90 bg-muted/50 rounded-md p-3 font-mono text-xs">
          {prompt.prompt}
        </p>

        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
          <div>
            <span className="text-muted-foreground">Style: </span>
            <span>{prompt.style}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Camera: </span>
            <span>{prompt.cameraAngle}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Lighting: </span>
            <span>{prompt.lighting}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Mood: </span>
            <span>{prompt.mood}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ImagePromptsPage() {
  const { uploadData, analysisData, projectType, reportDocument } = useWorkspace();
  const [promptList, setPromptList] = useState<ImagePromptResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!uploadData || !analysisData) return;
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch('/api/image-prompts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectType,
          sourceText: uploadData.text,
          analysis: analysisData,
        }),
      });
      if (!response.ok) {
        setError('Failed to generate image prompts. Please try again.');
        return;
      }
      const result: ImagePromptResult = await response.json();
      setPromptList(result);
    } catch {
      setError('Failed to generate image prompts. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [uploadData, analysisData, projectType]);

  if (!reportDocument || !analysisData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <h2 className="text-lg font-semibold">No analysis available</h2>
        <p className="text-sm text-muted-foreground">
          Upload material and run an analysis on the Projects page first.
        </p>
        <Link href="/" className={buttonVariants()}>
          Go to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Image Prompts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {reportDocument.cover.projectTypeLabel} · {reportDocument.title}
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : promptList ? (
            'Regenerate'
          ) : (
            'Generate Image Prompts'
          )}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {isGenerating && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {promptList && !isGenerating && (
        <div className="grid gap-4 md:grid-cols-2">
          {promptList.prompts.map((prompt, i) => (
            <PromptCard key={i} prompt={prompt} />
          ))}
        </div>
      )}

      {!promptList && !isGenerating && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 border rounded-md border-dashed">
          <p className="text-sm text-muted-foreground">
            Click &ldquo;Generate Image Prompts&rdquo; to create Midjourney/DALL-E prompts from your analysis.
          </p>
        </div>
      )}
    </div>
  );
}
