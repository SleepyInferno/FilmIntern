'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/contexts/workspace-context';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import type { ShotListResult, Shot } from '@/app/api/shot-lists/generate/route';

const SHOT_TYPE_LABELS: Record<string, string> = {
  WS: 'Wide Shot',
  MS: 'Medium Shot',
  CU: 'Close-Up',
  ECU: 'Extreme Close-Up',
  OTS: 'Over-the-Shoulder',
  POV: 'Point of View',
  INSERT: 'Insert',
  AERIAL: 'Aerial',
  'TWO-SHOT': 'Two-Shot',
};

function ShotRow({ shot, index }: { shot: Shot; index: number }) {
  const typeLabel = SHOT_TYPE_LABELS[shot.shotType] ?? shot.shotType;
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="py-3 px-4 text-sm font-medium text-muted-foreground w-12">
        {shot.sceneNumber}
      </td>
      <td className="py-3 px-4 text-sm w-40">
        <p className="font-medium">{shot.shotType}</p>
        <p className="text-xs text-muted-foreground">{typeLabel}</p>
      </td>
      <td className="py-3 px-4 text-sm">
        <p>{shot.description}</p>
        {shot.location && (
          <p className="text-xs text-muted-foreground mt-0.5">{shot.location}</p>
        )}
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground w-36">
        {shot.characters.length > 0 ? shot.characters.join(', ') : '—'}
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground w-32">{shot.cameraMovement}</td>
      <td className="py-3 px-4 text-sm text-muted-foreground w-24">{shot.estimatedDuration}</td>
      <td className="py-3 px-4 text-sm text-muted-foreground w-48">
        {shot.notes || '—'}
      </td>
    </tr>
  );
}

export default function ShotListsPage() {
  const { uploadData, analysisData, projectType, reportDocument } = useWorkspace();
  const [shotList, setShotList] = useState<ShotListResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!uploadData || !analysisData) return;
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch('/api/shot-lists/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectType,
          sourceText: uploadData.text,
          analysis: analysisData,
        }),
      });
      if (!response.ok) {
        setError('Failed to generate shot list. Please try again.');
        return;
      }
      const result: ShotListResult = await response.json();
      setShotList(result);
    } catch {
      setError('Failed to generate shot list. Please try again.');
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
          <h1 className="text-2xl font-semibold">Shot List</h1>
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
          ) : shotList ? (
            'Regenerate'
          ) : (
            'Generate Shot List'
          )}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {isGenerating && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-8 shrink-0" />
                <Skeleton className="h-4 w-16 shrink-0" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24 shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {shotList && !isGenerating && (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="py-2 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide w-12">#</th>
                <th className="py-2 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide w-40">Shot</th>
                <th className="py-2 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Description / Location</th>
                <th className="py-2 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide w-36">Characters</th>
                <th className="py-2 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide w-32">Movement</th>
                <th className="py-2 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide w-24">Duration</th>
                <th className="py-2 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide w-48">Notes</th>
              </tr>
            </thead>
            <tbody>
              {shotList.shots.map((shot, i) => (
                <ShotRow key={i} shot={shot} index={i} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!shotList && !isGenerating && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 border rounded-md border-dashed">
          <p className="text-sm text-muted-foreground">
            Click &ldquo;Generate Shot List&rdquo; to create a production shot list from your analysis.
          </p>
        </div>
      )}
    </div>
  );
}
