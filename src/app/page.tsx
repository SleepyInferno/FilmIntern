'use client';

import { useCallback, useRef } from 'react';
import { FileDropzone } from '@/components/file-dropzone';
import { ContentPreview } from '@/components/content-preview';
import { DocumentWorkspace } from '@/components/document-workspace';
import { NarrativeWorkspace } from '@/components/workspaces/narrative-workspace';
import { DocumentaryWorkspace } from '@/components/workspaces/documentary-workspace';
import { CorporateWorkspace } from '@/components/workspaces/corporate-workspace';
import { TvWorkspace } from '@/components/workspaces/tv-workspace';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, ChevronDown, Film } from 'lucide-react';
import { buildReportDocument } from '@/lib/documents/report-document';
import { useWorkspace } from '@/contexts/workspace-context';
import { PROJECT_TYPES } from '@/lib/types/project-types';
import type { GeneratedDocument, DocumentKind, ExportFormat } from '@/lib/documents/types';
import type { AnalysisReportKind } from '@/lib/documents/report-normalization';
import type { NarrativeAnalysis } from '@/lib/ai/schemas/narrative';
import type { DocumentaryAnalysis } from '@/lib/ai/schemas/documentary';
import type { CorporateAnalysis } from '@/lib/ai/schemas/corporate';
import type { TvEpisodicAnalysis } from '@/lib/ai/schemas/tv-episodic';

function WorkspaceForType({ projectType, data, isStreaming }: {
  projectType: string;
  data: Record<string, unknown> | null;
  isStreaming: boolean;
}) {
  switch (projectType) {
    case 'narrative':
      return <NarrativeWorkspace data={data as Partial<NarrativeAnalysis> | null} isStreaming={isStreaming} />;
    case 'documentary':
      return <DocumentaryWorkspace data={data as Partial<DocumentaryAnalysis> | null} isStreaming={isStreaming} />;
    case 'corporate':
      return <CorporateWorkspace data={data as Partial<CorporateAnalysis> | null} isStreaming={isStreaming} />;
    case 'tv-episodic':
      return <TvWorkspace data={data as Partial<TvEpisodicAnalysis> | null} isStreaming={isStreaming} />;
    default:
      return <DocumentaryWorkspace data={data as Partial<DocumentaryAnalysis> | null} isStreaming={isStreaming} />;
  }
}

function getReportKind(projectType: string): AnalysisReportKind {
  switch (projectType) {
    case 'documentary': return 'documentary';
    case 'corporate': return 'corporate';
    case 'narrative': return 'narrative-structure';
    case 'tv-episodic': return 'tv-episodic';
    default: return 'documentary';
  }
}

function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || 'Untitled';
}

export default function Home() {
  const {
    currentProjectId, setCurrentProjectId,
    projectType, setProjectType,
    uploadData, setUploadData,
    analysisData, setAnalysisData,
    isAnalyzing, setIsAnalyzing,
    analysisError, setAnalysisError,
    reportDocument, setReportDocument,
    generatedDocuments, setGeneratedDocuments,
    activeDocumentId, setActiveDocumentId,
    title, setTitle, writtenBy,
    isNewProjectMode, setIsNewProjectMode,
    saveAnalysis, saveGeneratedDocuments,
  } = useWorkspace();

  const projectIdRef = useRef<string | null>(currentProjectId);
  projectIdRef.current = currentProjectId;

  async function ensureProject(fileName: string, type: string): Promise<string> {
    if (projectIdRef.current) return projectIdRef.current;
    const t = title.trim() || titleFromFilename(fileName) || 'New Project';
    if (!title.trim()) setTitle(t);
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: t, projectType: type, fileName }),
    });
    const project = await res.json();
    setCurrentProjectId(project.id);
    return project.id;
  }

  function handleTypeChange(newType: string) {
    setProjectType(newType);
    setAnalysisData(null);
    setAnalysisError(null);
    setIsAnalyzing(false);
    setReportDocument(null);
    setGeneratedDocuments([]);
    setActiveDocumentId('');
    setCurrentProjectId(null);
  }

  async function handleFileUploaded(data: typeof uploadData) {
    setUploadData(data);
    setAnalysisData(null);
    setReportDocument(null);
    setGeneratedDocuments([]);
    setActiveDocumentId('');
    setAnalysisError(null);
    setCurrentProjectId(null);

    // Derive title from filename
    const fileName = (data?.metadata as { filename?: string })?.filename ?? '';
    const derivedTitle = title.trim() || titleFromFilename(fileName) || 'New Project';
    if (!title.trim()) setTitle(derivedTitle);

    // Create project stub in DB immediately so it's preserved in sidebar
    // even if the user clicks + before running analysis
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: derivedTitle, projectType, fileName: fileName || null }),
      });
      if (res.ok) {
        const project = await res.json();
        setCurrentProjectId(project.id);
        // Persist uploadData immediately so clicking this project in the sidebar restores the full state
        await fetch(`/api/projects/${project.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadData: data }),
        });
      }
    } catch {
      // Non-blocking — analysis will create project if this fails
    }
  }

  async function handleAnalyze() {
    if (!uploadData) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisData(null);
    setReportDocument(null);
    setGeneratedDocuments([]);

    const fileName = (uploadData.metadata as { filename?: string })?.filename ?? 'file';
    const projectId = await ensureProject(fileName, projectType);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: uploadData.text, projectType }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setAnalysisError(body?.error || 'Analysis could not be completed. Check your connection and try again.');
        setIsAnalyzing(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let finalData: Record<string, unknown> | null = null;

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        try {
          const partial = JSON.parse(accumulated);
          setAnalysisData(partial);
          finalData = partial;
        } catch {
          // Incomplete JSON — continue accumulating
        }
      }

      if (finalData) {
        const reportKind = getReportKind(projectType);
        const reportDoc = buildReportDocument({
          reportKind,
          projectType,
          analysis: finalData,
          sourceText: uploadData.text,
          title,
          writtenBy,
        });
        setReportDocument(reportDoc);
        setActiveDocumentId(reportDoc.id);
        // LIB-01: Auto-save analysis + report + source material after streaming completes
        await saveAnalysis(projectId, { uploadData: uploadData!, analysisData: finalData, reportDocument: reportDoc });
      }

      setIsAnalyzing(false);
    } catch {
      setAnalysisError('Analysis could not be completed. Check your connection and try again.');
      setIsAnalyzing(false);
    }
  }

  const handleGenerateDocument = useCallback(
    async (kind: Exclude<DocumentKind, 'report'>): Promise<void> => {
      if (!uploadData || !analysisData) return;

      try {
        const response = await fetch('/api/documents/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectType,
            documentKind: kind,
            sourceText: uploadData.text,
            title,
            writtenBy,
            analysis: analysisData,
          }),
        });

        if (!response.ok) return;

        const doc: GeneratedDocument = await response.json();
        const updated = [...generatedDocuments, doc];
        setGeneratedDocuments(updated);
        setActiveDocumentId(doc.id);

        // LIB-01: Auto-save generated documents to keep Library record current
        if (projectIdRef.current) {
          await saveGeneratedDocuments(projectIdRef.current, updated);
        }
      } catch {
        // Generation error — keep current state
      }
    },
    [uploadData, analysisData, projectType, title, writtenBy, generatedDocuments, saveGeneratedDocuments]
  );

  const handleUpdateDocument = useCallback(
    (id: string, content: Record<string, unknown>) => {
      setGeneratedDocuments((prev) =>
        prev.map((doc) =>
          doc.id === id
            ? { ...doc, content, updatedAt: new Date().toISOString() }
            : doc
        )
      );
    },
    []
  );

  const handleQuoteJump = useCallback((_quoteId: string) => {}, []);

  const handleExport = useCallback(
    async (format: ExportFormat, document: GeneratedDocument) => {
      const url = format === 'pdf' ? '/api/export/pdf' : '/api/export/docx';
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document }),
        });
        if (!response.ok) return;
        const blob = await response.blob();
        const disposition = response.headers.get('Content-Disposition');
        const filenameMatch = disposition?.match(/filename="([^"]+)"/);
        const filename = filenameMatch?.[1] ?? `export.${format}`;
        const blobUrl = URL.createObjectURL(blob);
        const anchor = window.document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(blobUrl);
      } catch {
        // Export error — keep current state
      }
    },
    []
  );

  const projectTypeOptions = Object.values(PROJECT_TYPES);
  const showCreationUI = isNewProjectMode || (!!uploadData && !reportDocument && !isAnalyzing);
  const showEmptyState = !showCreationUI && !reportDocument && !isAnalyzing;

  function handleCancelNew() {
    setUploadData(null);
    setAnalysisError(null);
    setIsNewProjectMode(false);
  }

  return (
    <div className="space-y-6 py-6">

      {/* Empty state — no project open, not creating */}
      {showEmptyState && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <Film size={48} className="text-muted-foreground/20" />
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">No project open</p>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Select a saved project from the sidebar, or click <span className="font-medium text-foreground">+</span> to start a new one.
            </p>
          </div>
        </div>
      )}

      {/* New project creation UI */}
      {showCreationUI && (
        <div className="space-y-5">
          {/* Header with cancel */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">New Project</p>
            <button
              onClick={handleCancelNew}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            >
              Cancel
            </button>
          </div>

          {/* Project name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-name" className="text-sm font-medium text-foreground">
              Project Name
            </label>
            <input
              id="project-name"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Last Frontier"
              className="w-72 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Project type */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-type" className="text-sm font-medium text-foreground">
              Project Type
            </label>
            <div className="relative w-64">
              <select
                id="project-type"
                value={projectType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                {projectTypeOptions.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </div>
            {PROJECT_TYPES[projectType] && (
              <p className="text-xs text-muted-foreground">{PROJECT_TYPES[projectType].description}</p>
            )}
          </div>

          {/* Drop zone — only show if no file uploaded yet */}
          {!uploadData && <FileDropzone onFileUploaded={handleFileUploaded} />}

          {/* File preview + analyze */}
          {uploadData && (
            <>
              <ContentPreview text={uploadData.text} metadata={uploadData.metadata} />
              <Button size="lg" onClick={handleAnalyze} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Run Analysis'
                )}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Error state */}
      {analysisError && (
        <Card className="border-destructive">
          <CardContent>
            <p className="text-sm text-destructive">{analysisError}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={handleAnalyze}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Analysis in progress */}
      {isAnalyzing && (
        <>
          <Separator />
          <WorkspaceForType projectType={projectType} data={analysisData} isStreaming={true} />
        </>
      )}

      {/* Analysis complete */}
      {reportDocument && !isAnalyzing && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {PROJECT_TYPES[projectType]?.label ?? projectType}
            </span>
            {title && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-sm font-medium text-foreground">{title}</span>
              </>
            )}
          </div>
          <DocumentWorkspace
            projectType={projectType}
            reportDocument={reportDocument}
            generatedDocuments={generatedDocuments}
            activeDocumentId={activeDocumentId}
            onActiveDocumentChange={setActiveDocumentId}
            onGenerateDocument={handleGenerateDocument}
            onUpdateDocument={handleUpdateDocument}
            onQuoteJump={handleQuoteJump}
            onExport={handleExport}
            analysisData={analysisData}
            workspaceProjectType={projectType}
          />
        </>
      )}
    </div>
  );
}
