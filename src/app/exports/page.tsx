'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/contexts/workspace-context';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { ExportFormat, GeneratedDocument } from '@/lib/documents/types';

export default function ExportsPage() {
  const { reportDocument, generatedDocuments } = useWorkspace();
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = useCallback(
    async (format: ExportFormat, doc: GeneratedDocument) => {
      const key = `${doc.id}-${format}`;
      setExporting(key);
      const url = format === 'pdf' ? '/api/export/pdf' : '/api/export/docx';
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document: doc }),
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
        // keep current state
      } finally {
        setExporting(null);
      }
    },
    []
  );

  if (!reportDocument) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <h2 className="text-lg font-semibold">No documents to export</h2>
        <p className="text-sm text-muted-foreground">
          Run an analysis and generate documents first.
        </p>
        <Link href="/" className={buttonVariants()}>
          Go to Projects
        </Link>
      </div>
    );
  }

  const allDocs = [reportDocument, ...generatedDocuments];

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Exports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {allDocs.length} document{allDocs.length !== 1 ? 's' : ''} available for export
        </p>
      </div>

      {allDocs.map((doc) => {
        const date = new Date(doc.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        const pdfKey = `${doc.id}-pdf`;
        const docxKey = `${doc.id}-docx`;
        return (
          <Card key={doc.id}>
            <CardContent className="pt-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium">{doc.cover.typeLabel}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {doc.cover.projectTypeLabel} · {doc.title} · {date}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={exporting !== null}
                  onClick={() => handleExport('pdf', doc)}
                >
                  {exporting === pdfKey ? (
                    <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />PDF</>
                  ) : 'PDF'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={exporting !== null}
                  onClick={() => handleExport('docx', doc)}
                >
                  {exporting === docxKey ? (
                    <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />DOCX</>
                  ) : 'DOCX'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
