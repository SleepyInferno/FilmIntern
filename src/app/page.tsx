'use client';

import { useState, useCallback } from 'react';
import { ProjectTypeTabs } from '@/components/project-type-tabs';
import { FileDropzone } from '@/components/file-dropzone';
import { ContentPreview } from '@/components/content-preview';
import { DocumentWorkspace } from '@/components/document-workspace';
import { ShortFormInputToggle } from '@/components/short-form-input-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { buildReportDocument } from '@/lib/documents/report-document';
import type { ParseResult } from '@/lib/parsers/txt-parser';
import type { GeneratedDocument, DocumentKind, ExportFormat } from '@/lib/documents/types';
import type { AnalysisReportKind } from '@/lib/documents/report-normalization';

interface UploadData {
  text: string;
  metadata: ParseResult['metadata'];
}

function getReportKind(projectType: string): AnalysisReportKind {
  switch (projectType) {
    case 'documentary':
      return 'documentary';
    case 'corporate':
      return 'corporate';
    case 'narrative':
      return 'narrative-structure';
    case 'tv-episodic':
      return 'tv-episodic';
    case 'short-form':
      return 'short-form';
    default:
      return 'documentary';
  }
}

export default function Home() {
  const [projectType, setProjectType] = useState('documentary');
  const [inputType, setInputType] = useState('script-storyboard');
  const [uploadData, setUploadData] = useState<UploadData | null>(null);
  const [analysisData, setAnalysisData] = useState<Record<string, unknown> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Document workspace state
  const [reportDocument, setReportDocument] = useState<GeneratedDocument | null>(null);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string>('');
  const [title] = useState('Untitled');
  const [writtenBy] = useState('FilmIntern');

  function handleTypeChange(newType: string) {
    setProjectType(newType);
    setAnalysisData(null);
    setAnalysisError(null);
    setIsAnalyzing(false);
    setReportDocument(null);
    setGeneratedDocuments([]);
    setActiveDocumentId('');
    if (newType !== 'short-form') setInputType('script-storyboard');
  }

  async function handleAnalyze() {
    if (!uploadData) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisData(null);
    setReportDocument(null);
    setGeneratedDocuments([]);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: uploadData.text,
          projectType,
          ...(projectType === 'short-form' ? { inputType } : {}),
        }),
      });

      if (!response.ok) {
        setAnalysisError('Analysis could not be completed. Check your connection and try again.');
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
          // Incomplete JSON -- continue accumulating
        }
      }

      // Build report document after analysis completes
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
      }

      setIsAnalyzing(false);
    } catch {
      setAnalysisError('Analysis could not be completed. Check your connection and try again.');
      setIsAnalyzing(false);
    }
  }

  const handleGenerateDocument = useCallback(
    async (kind: Exclude<DocumentKind, 'report'>) => {
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
        setGeneratedDocuments((prev) => [...prev, doc]);
        setActiveDocumentId(doc.id);
      } catch {
        // Generation error -- keep current state
      }
    },
    [uploadData, analysisData, projectType, title, writtenBy]
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

  const handleQuoteJump = useCallback((_quoteId: string) => {
    // The workspace handles the actual scroll/focus behavior.
    // This callback is for page-level awareness of jumps.
  }, []);

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
        // Export error -- keep current state
      }
    },
    []
  );

  const buttonText = analysisData && !isAnalyzing ? 'Re-run Analysis' : 'Run Analysis';

  return (
    <ProjectTypeTabs value={projectType} onValueChange={handleTypeChange}>
      <div className="space-y-6 py-6">
        {projectType === 'short-form' && (
          <ShortFormInputToggle value={inputType} onChange={setInputType} />
        )}

        <FileDropzone onFileUploaded={setUploadData} />

        {uploadData && (
          <>
            <ContentPreview
              text={uploadData.text}
              metadata={uploadData.metadata}
            />
            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                buttonText
              )}
            </Button>
          </>
        )}

        {(uploadData || analysisData || isAnalyzing) && <Separator />}

        {analysisError && (
          <Card className="border-destructive">
            <CardContent>
              <p className="text-sm text-destructive">{analysisError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleAnalyze}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {reportDocument && !isAnalyzing && (
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
          />
        )}

        {isAnalyzing && (
          <p className="text-sm text-muted-foreground">
            Analyzing your material...
          </p>
        )}
      </div>
    </ProjectTypeTabs>
  );
}
