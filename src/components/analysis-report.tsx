'use client';

import type { DocumentaryAnalysis } from '@/lib/ai/schemas/documentary';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SummarySection } from '@/components/report-sections/summary-section';
import { QuotesSection } from '@/components/report-sections/quotes-section';
import { ThemesSection } from '@/components/report-sections/themes-section';
import { MomentsSection } from '@/components/report-sections/moments-section';
import { EditorialSection } from '@/components/report-sections/editorial-section';

interface AnalysisReportProps {
  data: Partial<DocumentaryAnalysis> | null;
  isStreaming: boolean;
}

export function AnalysisReport({ data, isStreaming }: AnalysisReportProps) {
  if (!data && !isStreaming) {
    return (
      <p className="text-sm text-muted-foreground">
        Upload a transcript and click Run Analysis
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {isStreaming && (
        <p className="text-sm text-muted-foreground">
          Analyzing your transcript...
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <SummarySection data={data?.summary} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Key Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          <QuotesSection data={data?.keyQuotes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Recurring Themes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ThemesSection data={data?.recurringThemes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Key Moments</CardTitle>
        </CardHeader>
        <CardContent>
          <MomentsSection data={data?.keyMoments} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Editorial Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditorialSection data={data?.editorialNotes} />
        </CardContent>
      </Card>
    </div>
  );
}
