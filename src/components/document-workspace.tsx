'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getAvailableDocumentKinds } from '@/lib/documents/availability';
import type {
  GeneratedDocument,
  DocumentKind,
  ExportFormat,
} from '@/lib/documents/types';

interface DocumentWorkspaceProps {
  projectType: string;
  reportDocument: GeneratedDocument;
  generatedDocuments: GeneratedDocument[];
  activeDocumentId: string;
  onActiveDocumentChange: (id: string) => void;
  onGenerateDocument: (kind: Exclude<DocumentKind, 'report'>) => void;
  onUpdateDocument: (id: string, content: Record<string, unknown>) => void;
  onQuoteJump: (quoteId: string) => void;
  onExport: (format: ExportFormat, document: GeneratedDocument) => Promise<void> | void;
}

function kindLabel(kind: Exclude<DocumentKind, 'report'>): string {
  switch (kind) {
    case 'outline':
      return 'Generate Outline';
    case 'treatment':
      return 'Generate Treatment';
    case 'proposal':
      return 'Generate Proposal';
  }
}

interface QuoteRefListProps {
  quoteRefs: GeneratedDocument['quoteRefs'];
  onQuoteClick: (quoteId: string) => void;
}

function QuoteRefList({ quoteRefs, onQuoteClick }: QuoteRefListProps) {
  if (quoteRefs.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2 mb-4">
      {quoteRefs.map((ref) => (
        <button
          key={ref.id}
          className="text-sm text-blue-600 hover:underline cursor-pointer"
          onClick={() => onQuoteClick(ref.id)}
        >
          [{ref.label}]
        </button>
      ))}
    </div>
  );
}

interface TiptapContentProps {
  content: Record<string, unknown>;
  quoteRefs: GeneratedDocument['quoteRefs'];
}

function TiptapContentRenderer({ content, quoteRefs }: TiptapContentProps) {
  const nodes = (content as { type: string; content?: Array<Record<string, unknown>> }).content ?? [];
  return (
    <div className="prose prose-sm max-w-none">
      {nodes.map((node, i) => {
        const nodeType = node.type as string;
        const textContent = ((node.content as Array<{ text?: string }>) ?? [])
          .map((c) => c.text ?? '')
          .join('');

        if (nodeType === 'heading') {
          const level = (node.attrs as { level: number })?.level ?? 2;
          const Tag = `h${level}` as keyof JSX.IntrinsicElements;
          return <Tag key={i}>{textContent}</Tag>;
        }
        return <p key={i}>{textContent}</p>;
      })}
      {quoteRefs.map((ref) => (
        <span
          key={ref.id}
          data-quote-target={ref.id}
          tabIndex={-1}
          className="sr-only"
        >
          {ref.label}: {ref.text}
        </span>
      ))}
    </div>
  );
}

export function DocumentWorkspace({
  projectType,
  reportDocument,
  generatedDocuments,
  activeDocumentId,
  onActiveDocumentChange,
  onGenerateDocument,
  onUpdateDocument,
  onQuoteJump,
  onExport,
}: DocumentWorkspaceProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const availableKinds = getAvailableDocumentKinds(projectType).filter(
    (k): k is Exclude<DocumentKind, 'report'> => k !== 'report'
  );

  const allDocuments = [reportDocument, ...generatedDocuments];
  const activeDocument =
    allDocuments.find((d) => d.id === activeDocumentId) ?? reportDocument;

  const handleQuoteClick = useCallback(
    (quoteId: string) => {
      const container = workspaceRef.current;
      if (!container) return;

      const target = container.querySelector(
        `[data-quote-target="${quoteId}"]`
      ) as HTMLElement | null;
      if (target) {
        target.focus();
        target.scrollIntoView({ block: 'center' });
      }
      onQuoteJump(quoteId);
    },
    [onQuoteJump]
  );

  const handleExportFormat = useCallback(
    (format: ExportFormat) => {
      setExportOpen(false);
      onExport(format, activeDocument);
    },
    [activeDocument, onExport]
  );

  const handleEditorInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      const text = (e.target as HTMLDivElement).textContent ?? '';
      const updatedContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text }],
          },
        ],
      };
      onUpdateDocument(activeDocumentId, updatedContent);
    },
    [activeDocumentId, onUpdateDocument]
  );

  const isReport = activeDocument.kind === 'report';

  return (
    <div ref={workspaceRef} className="space-y-4">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {availableKinds.map((kind) => (
            <Button
              key={kind}
              variant="outline"
              size="sm"
              onClick={() => onGenerateDocument(kind)}
            >
              {kindLabel(kind)}
            </Button>
          ))}
        </div>

        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(!exportOpen)}
          >
            Export
          </Button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 z-10 bg-white border rounded-md shadow-md min-w-[160px]">
              <button
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                onClick={() => handleExportFormat('pdf')}
              >
                PDF (.pdf)
              </button>
              <button
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                onClick={() => handleExportFormat('docx')}
              >
                Word (.docx)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeDocumentId}
        onValueChange={(v) => onActiveDocumentChange(v as string)}
      >
        <TabsList>
          <TabsTrigger value={reportDocument.id}>Report</TabsTrigger>
          {generatedDocuments.map((doc) => (
            <TabsTrigger key={doc.id} value={doc.id}>
              {doc.cover.typeLabel}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={reportDocument.id}>
          <Card>
            <CardContent className="pt-4">
              <QuoteRefList
                quoteRefs={reportDocument.quoteRefs}
                onQuoteClick={handleQuoteClick}
              />
              <TiptapContentRenderer
                content={reportDocument.content}
                quoteRefs={reportDocument.quoteRefs}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {generatedDocuments.map((doc) => (
          <TabsContent key={doc.id} value={doc.id}>
            <Card>
              <CardContent className="pt-4">
                <QuoteRefList
                  quoteRefs={doc.quoteRefs}
                  onQuoteClick={handleQuoteClick}
                />
                <div
                  data-testid="document-editor"
                  contentEditable
                  suppressContentEditableWarning
                  className="prose prose-sm max-w-none min-h-[200px] focus:outline-none"
                  onInput={handleEditorInput}
                >
                  <TiptapContentRenderer
                    content={doc.content}
                    quoteRefs={doc.quoteRefs}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
