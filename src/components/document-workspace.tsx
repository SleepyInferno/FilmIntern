'use client';

import { useState, useCallback, useRef, Fragment } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { getAvailableDocumentKinds } from '@/lib/documents/availability';
import { NarrativeWorkspace } from '@/components/workspaces/narrative-workspace';
import { DocumentaryWorkspace } from '@/components/workspaces/documentary-workspace';
import { CorporateWorkspace } from '@/components/workspaces/corporate-workspace';
import { TvWorkspace } from '@/components/workspaces/tv-workspace';
import { ShortFormWorkspace } from '@/components/workspaces/short-form-workspace';
import type {
  GeneratedDocument,
  DocumentKind,
  ExportFormat,
} from '@/lib/documents/types';
import type { NarrativeAnalysis } from '@/lib/ai/schemas/narrative';
import type { DocumentaryAnalysis } from '@/lib/ai/schemas/documentary';
import type { CorporateAnalysis } from '@/lib/ai/schemas/corporate';
import type { TvEpisodicAnalysis } from '@/lib/ai/schemas/tv-episodic';
import type { ShortFormAnalysis } from '@/lib/ai/schemas/short-form';

interface DocumentWorkspaceProps {
  projectType: string;
  reportDocument: GeneratedDocument;
  generatedDocuments: GeneratedDocument[];
  activeDocumentId: string;
  onActiveDocumentChange: (id: string) => void;
  onGenerateDocument: (kind: Exclude<DocumentKind, 'report'>) => Promise<void>;
  onUpdateDocument: (id: string, content: Record<string, unknown>) => void;
  onQuoteJump: (quoteId: string) => void;
  onExport: (format: ExportFormat, document: GeneratedDocument) => Promise<void> | void;
  analysisData?: Record<string, unknown> | null;
  workspaceProjectType?: string;
}

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
    case 'short-form':
      return <ShortFormWorkspace data={data as Partial<ShortFormAnalysis> | null} isStreaming={isStreaming} />;
    default:
      return <DocumentaryWorkspace data={data as Partial<DocumentaryAnalysis> | null} isStreaming={isStreaming} />;
  }
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

function kindShortLabel(kind: Exclude<DocumentKind, 'report'>): string {
  switch (kind) {
    case 'outline':
      return 'Outline';
    case 'treatment':
      return 'Treatment';
    case 'proposal':
      return 'Proposal';
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

function DocumentCoverHeader({ cover }: { cover: GeneratedDocument['cover'] }) {
  const date = new Date(cover.dateLabel).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return (
    <div className="mb-6 pb-4 border-b">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
        {cover.projectTypeLabel} · {cover.typeLabel}
      </p>
      <h1 className="text-xl font-semibold leading-tight">{cover.title}</h1>
      <p className="text-sm text-muted-foreground mt-1">
        {cover.writtenBy} · {date}
      </p>
    </div>
  );
}

function renderTextNode(node: Record<string, unknown>, i: number) {
  const text = (node.text as string) ?? '';
  const marks = (node.marks as Array<{ type: string }>) ?? [];
  if (marks.some((m) => m.type === 'bold')) {
    return <strong key={i}>{text}</strong>;
  }
  return <Fragment key={i}>{text}</Fragment>;
}

function renderNode(node: Record<string, unknown>, i: number) {
  const type = node.type as string;
  const children = (node.content as Array<Record<string, unknown>>) ?? [];

  if (type === 'heading') {
    const level = (node.attrs as { level: number })?.level ?? 2;
    const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    return <Tag key={i}>{children.map(renderTextNode)}</Tag>;
  }
  if (type === 'paragraph') {
    if (children.length === 0) return null;
    return <p key={i}>{children.map(renderTextNode)}</p>;
  }
  if (type === 'bulletList') {
    return <ul key={i}>{children.map((child, j) => renderNode(child, j))}</ul>;
  }
  if (type === 'listItem') {
    return (
      <li key={i}>
        {children.map((child, j) => {
          if (child.type === 'paragraph') {
            const textNodes = (child.content as Array<Record<string, unknown>>) ?? [];
            return <Fragment key={j}>{textNodes.map(renderTextNode)}</Fragment>;
          }
          return renderNode(child, j);
        })}
      </li>
    );
  }
  return null;
}

interface TiptapContentProps {
  content: Record<string, unknown>;
  quoteRefs: GeneratedDocument['quoteRefs'];
}

function TiptapContentRenderer({ content, quoteRefs }: TiptapContentProps) {
  const nodes = (content as { content?: Array<Record<string, unknown>> }).content ?? [];
  return (
    <div className="prose prose-sm max-w-none">
      {nodes.map((node, i) => renderNode(node, i))}
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
  analysisData,
  workspaceProjectType,
}: DocumentWorkspaceProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [generatingKind, setGeneratingKind] = useState<Exclude<DocumentKind, 'report'> | null>(null);
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
          {availableKinds.map((kind) => {
            const isGenerating = generatingKind === kind;
            return (
              <Button
                key={kind}
                variant="outline"
                size="sm"
                disabled={generatingKind !== null}
                onClick={async () => {
                  setGeneratingKind(kind);
                  try {
                    await onGenerateDocument(kind);
                  } finally {
                    setGeneratingKind(null);
                  }
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  kindLabel(kind)
                )}
              </Button>
            );
          })}
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
        value={generatingKind !== null ? '__generating__' : activeDocumentId}
        onValueChange={(v) => {
          if (v !== '__generating__') onActiveDocumentChange(v);
        }}
      >
        <TabsList>
          <TabsTrigger value={reportDocument.id}>Report</TabsTrigger>
          {generatedDocuments.map((doc) => (
            <TabsTrigger key={doc.id} value={doc.id}>
              {doc.cover.typeLabel}
            </TabsTrigger>
          ))}
          {generatingKind !== null && (
            <TabsTrigger value="__generating__">
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              {kindShortLabel(generatingKind)}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value={reportDocument.id}>
          {analysisData && workspaceProjectType ? (
            <WorkspaceForType
              projectType={workspaceProjectType}
              data={analysisData}
              isStreaming={false}
            />
          ) : (
            <Card>
              <CardContent className="pt-4">
                <DocumentCoverHeader cover={reportDocument.cover} />
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
          )}
        </TabsContent>

        {generatedDocuments.map((doc) => (
          <TabsContent key={doc.id} value={doc.id}>
            <Card>
              <CardContent className="pt-4">
                <DocumentCoverHeader cover={doc.cover} />
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

        {generatingKind !== null && (
          <TabsContent value="__generating__">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="pt-1">
                  <Skeleton className="h-5 w-1/3" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/5" />
                <div className="pt-1">
                  <Skeleton className="h-5 w-2/5" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
