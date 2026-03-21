'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-[200px]" />
          <Skeleton className="h-5 w-[100px]" />
        </div>
        <Skeleton className="h-[120px] w-full rounded-lg" />
        <Skeleton className="h-[120px] w-full rounded-lg" />
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
      <Card role="region" aria-label="Suggestion generation">
        <CardContent className="py-12 text-center text-muted-foreground">
          Suggestion generation will appear here
        </CardContent>
      </Card>
      <Card role="region" aria-label="Review and export tools">
        <CardContent className="py-12 text-center text-muted-foreground">
          Review and export tools will appear here
        </CardContent>
      </Card>
    </div>
  );
}
