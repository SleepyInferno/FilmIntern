'use client';

import Link from 'next/link';
import { useWorkspace } from '@/contexts/workspace-context';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { reportDocument, generatedDocuments, uploadData } = useWorkspace();

  if (!reportDocument) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <h2 className="text-lg font-semibold">No active project</h2>
        <p className="text-sm text-muted-foreground">
          Upload material and run an analysis to get started.
        </p>
        <Link href="/" className={buttonVariants()}>
          Start a project
        </Link>
      </div>
    );
  }

  const wordCount = uploadData
    ? uploadData.text.split(/\s+/).filter(Boolean).length
    : 0;

  const projectTypeLabel = reportDocument.cover.projectTypeLabel;
  const createdAt = new Date(reportDocument.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">{reportDocument.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {projectTypeLabel} · Analyzed {createdAt}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Project Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{projectTypeLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{generatedDocuments.length + 1}</p>
            <p className="text-xs text-muted-foreground">
              {generatedDocuments.length > 0
                ? generatedDocuments.map((d) => d.cover.typeLabel).join(', ')
                : 'Report only'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Source Material
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{wordCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">words</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          View Analysis
        </Link>
        <Link href="/shot-lists" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          Generate Shot List
        </Link>
        <Link href="/image-prompts" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          Generate Image Prompts
        </Link>
        <Link href="/exports" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          Export Documents
        </Link>
      </div>
    </div>
  );
}
