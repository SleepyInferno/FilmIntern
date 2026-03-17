'use client';

import { useState } from 'react';
import { ProjectTypeTabs } from '@/components/project-type-tabs';
import { FileDropzone } from '@/components/file-dropzone';
import { ContentPreview } from '@/components/content-preview';
import { AnalysisReport } from '@/components/analysis-report';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import type { ParseResult } from '@/lib/parsers/txt-parser';
import type { DocumentaryAnalysis } from '@/lib/ai/schemas/documentary';

interface UploadData {
  text: string;
  metadata: ParseResult['metadata'];
}

export default function Home() {
  const [uploadData, setUploadData] = useState<UploadData | null>(null);
  const [analysisData, setAnalysisData] = useState<Partial<DocumentaryAnalysis> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!uploadData) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisData(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: uploadData.text, projectType: 'documentary' }),
      });

      if (!response.ok) {
        setAnalysisError('Analysis could not be completed. Check your connection and try again.');
        setIsAnalyzing(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        try {
          const partial = JSON.parse(accumulated);
          setAnalysisData(partial);
        } catch {
          // Incomplete JSON -- continue accumulating
        }
      }

      setIsAnalyzing(false);
    } catch {
      setAnalysisError('Analysis could not be completed. Check your connection and try again.');
      setIsAnalyzing(false);
    }
  }

  const buttonText = analysisData && !isAnalyzing ? 'Re-run Analysis' : 'Run Analysis';

  return (
    <ProjectTypeTabs>
      <div className="space-y-6 py-6">
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

        <AnalysisReport data={analysisData} isStreaming={isAnalyzing} />
      </div>
    </ProjectTypeTabs>
  );
}
