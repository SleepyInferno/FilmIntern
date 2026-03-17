'use client';

import { useState } from 'react';
import { ProjectTypeTabs } from '@/components/project-type-tabs';
import { FileDropzone } from '@/components/file-dropzone';
import { ContentPreview } from '@/components/content-preview';
import { AnalysisReport } from '@/components/analysis-report';
import { NarrativeReport } from '@/components/narrative-report';
import { CorporateReport } from '@/components/corporate-report';
import { TvReport } from '@/components/tv-report';
import { ShortFormReport } from '@/components/short-form-report';
import { ShortFormInputToggle } from '@/components/short-form-input-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import type { ParseResult } from '@/lib/parsers/txt-parser';
import type { DocumentaryAnalysis } from '@/lib/ai/schemas/documentary';
import type { CorporateAnalysis } from '@/lib/ai/schemas/corporate';
import type { NarrativeAnalysis } from '@/lib/ai/schemas/narrative';
import type { TvEpisodicAnalysis } from '@/lib/ai/schemas/tv-episodic';
import type { ShortFormAnalysis } from '@/lib/ai/schemas/short-form';

interface UploadData {
  text: string;
  metadata: ParseResult['metadata'];
}

export default function Home() {
  const [projectType, setProjectType] = useState('documentary');
  const [inputType, setInputType] = useState('script-storyboard');
  const [uploadData, setUploadData] = useState<UploadData | null>(null);
  const [analysisData, setAnalysisData] = useState<Record<string, unknown> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  function handleTypeChange(newType: string) {
    setProjectType(newType);
    setAnalysisData(null);
    setAnalysisError(null);
    setIsAnalyzing(false);
    if (newType !== 'short-form') setInputType('script-storyboard');
  }

  async function handleAnalyze() {
    if (!uploadData) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisData(null);

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

  function renderReport() {
    switch (projectType) {
      case 'documentary':
        return (
          <AnalysisReport
            data={analysisData as Partial<DocumentaryAnalysis> | null}
            isStreaming={isAnalyzing}
          />
        );
      case 'corporate':
        return (
          <CorporateReport
            data={analysisData as Partial<CorporateAnalysis> | null}
            isStreaming={isAnalyzing}
          />
        );
      case 'narrative':
        return (
          <NarrativeReport
            data={analysisData as Partial<NarrativeAnalysis> | null}
            isStreaming={isAnalyzing}
          />
        );
      case 'tv-episodic':
        return (
          <TvReport
            data={analysisData as Partial<TvEpisodicAnalysis> | null}
            isStreaming={isAnalyzing}
          />
        );
      case 'short-form':
        return (
          <ShortFormReport
            data={analysisData as Partial<ShortFormAnalysis> | null}
            isStreaming={isAnalyzing}
          />
        );
      default:
        return null;
    }
  }

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

        {renderReport()}
      </div>
    </ProjectTypeTabs>
  );
}
