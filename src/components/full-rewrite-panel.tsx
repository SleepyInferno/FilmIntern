'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, Flame, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ValidationIssue {
  character?: string;
  beatNumber?: number;
  category?: string;
  location?: string;
  issue?: string;
  example?: string;
  severity?: string;
}

interface ValidationData {
  overallScore: number;
  characterDrift: ValidationIssue[];
  lostBeats: ValidationIssue[];
  toneShifts: ValidationIssue[];
  aiWritingFlags: ValidationIssue[];
  strengths: string[];
  summary: string;
}

type Phase =
  | 'idle'
  | 'extracting'
  | 'rewriting'
  | 'validating'
  | 'recritiquing'
  | 'rewriting2'
  | 'validating2'
  | 'complete'
  | 'error';

interface FullRewritePanelProps {
  projectId: string;
  projectTitle: string;
  hasCriticAnalysis: boolean;
  scriptText: string;
}

export function FullRewritePanel({
  projectId,
  projectTitle,
  hasCriticAnalysis,
  scriptText,
}: FullRewritePanelProps) {
  const [rewriteText, setRewriteText] = useState<string>('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [phaseMessage, setPhaseMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [validation, setValidation] = useState<ValidationData | null>(null);
  const [finalValidation, setFinalValidation] = useState<ValidationData | null>(null);
  const [notes, setNotes] = useState('');
  const [isExtreme, setIsExtreme] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Abort any in-flight generation on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  // Load previously saved rewrite on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/projects/${projectId}/rewrite`);
        if (res.ok) {
          const data = await res.json();
          if (data.fullRewrite) {
            setRewriteText(data.fullRewrite);
            setPhase('complete');
          }
        }
      } catch {
        // Silently fail
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, [projectId]);

  // Auto-scroll during streaming
  useEffect(() => {
    if ((phase === 'rewriting' || phase === 'rewriting2') && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [rewriteText, phase]);

  const handleGenerate = useCallback(async (extreme: boolean) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsExtreme(extreme);
    setPhase('extracting');
    setPhaseMessage('');
    setError(null);
    setRewriteText('');
    setValidation(null);
    setFinalValidation(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notes.trim() || undefined,
          extreme,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Rewrite failed' }));
        setError(errData.error || 'Rewrite generation failed');
        setPhase('error');
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError('Stream not available');
        setPhase('error');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);

            switch (event.phase) {
              case 'extracting':
                setPhase('extracting');
                setPhaseMessage(event.message || 'Analyzing characters and story beats...');
                break;
              case 'bible':
                break;
              case 'rewriting':
                setPhase('rewriting');
                setPhaseMessage(event.message || 'Rewriting script...');
                break;
              case 'chunk':
                accumulated += event.text;
                setRewriteText(accumulated);
                break;
              case 'validating':
                setPhase('validating');
                setPhaseMessage(event.message || 'Running supervisor check...');
                break;
              case 'validation':
                setValidation(event.data as ValidationData);
                break;
              case 'recritiquing':
                setPhase('recritiquing');
                setPhaseMessage(event.message || 'Re-running Harsh Critic...');
                break;
              case 'recritique':
                break;
              case 'rewriting2':
                setPhase('rewriting2');
                setPhaseMessage(event.message || 'Rewriting with new findings...');
                accumulated = '';
                setRewriteText('');
                break;
              case 'chunk2':
                accumulated += event.text;
                setRewriteText(accumulated);
                break;
              case 'validating2':
                setPhase('validating2');
                setPhaseMessage(event.message || 'Final supervisor check...');
                break;
              case 'validation2':
                setFinalValidation(event.data as ValidationData);
                break;
              case 'complete':
                setPhase('complete');
                break;
              case 'error':
                setError(event.message || 'An error occurred during rewrite');
                setPhase('error');
                break;
            }
          } catch {
            // Skip malformed NDJSON lines
          }
        }
      }

      // Process any trailing buffer
      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer);
          if (event.phase === 'complete') setPhase('complete');
          else if (event.phase === 'error') {
            setError(event.message || 'An error occurred');
            setPhase('error');
          } else if (event.phase === 'chunk') {
            accumulated += event.text;
            setRewriteText(accumulated);
          } else if (event.phase === 'chunk2') {
            accumulated += event.text;
            setRewriteText(accumulated);
          } else if (event.phase === 'validation') {
            setValidation(event.data as ValidationData);
          } else if (event.phase === 'validation2') {
            setFinalValidation(event.data as ValidationData);
          }
        } catch {
          // Skip malformed trailing data
        }
      }

      // Save to DB if we got a rewrite
      if (accumulated) {
        await fetch(`/api/projects/${projectId}/rewrite`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullRewrite: accumulated }),
        });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return; // User navigated away
      setError('Rewrite generation failed. Check your AI provider settings and try again.');
      setPhase('error');
    }
  }, [projectId, notes]);

  const handleExport = useCallback(async (format: 'pdf' | 'docx') => {
    const setExporting = format === 'pdf' ? setExportingPdf : setExportingDocx;
    setExporting(true);

    try {
      const res = await fetch('/api/export/revised-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          format,
          title: projectTitle,
          source: 'rewrite',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Export failed' }));
        console.error('Export error:', err.error);
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="(.+?)"/);
      const filename = match?.[1] ?? `${projectTitle}-rewrite.${format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  }, [projectId, projectTitle]);

  const isGenerating = phase !== 'idle' && phase !== 'complete' && phase !== 'error';
  const displayValidation = finalValidation ?? validation;

  if (!loaded) return null;

  // Determine which phases to show based on mode
  const extremePhases = isExtreme || phase === 'recritiquing' || phase === 'rewriting2' || phase === 'validating2';

  return (
    <div className="space-y-4">
      {/* Generate controls */}
      <div className="border rounded-lg p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Full Script Rewrite</h3>
          <p className="text-xs text-muted-foreground mt-1">
            AI rewrites your script based on the Harsh Critic analysis, preserving
            your story, characters, and structure.
          </p>
        </div>

        {!hasCriticAnalysis && (
          <p className="text-xs text-amber-600">
            Run a Harsh Critic analysis first to enable full rewrite generation.
          </p>
        )}

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        {/* Notes field */}
        <div>
          <label htmlFor="rewrite-notes" className="text-xs font-medium text-muted-foreground">
            Writer&apos;s Notes <span className="font-normal">(optional — specific instructions for the rewrite)</span>
          </label>
          <textarea
            id="rewrite-notes"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            rows={3}
            placeholder="e.g., Don't soften the ending scene. Keep Maria's accent stronger. The confrontation in Scene 4 needs to stay uncomfortable..."
            value={notes}
            maxLength={5000}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        {/* Phase progress */}
        {isGenerating && (
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500 shrink-0" />
            <div className="flex items-center gap-1.5 flex-wrap">
              <PhaseIndicator label="Characters" active={phase === 'extracting'} done={phase !== 'extracting'} />
              <span className="text-muted-foreground">&rarr;</span>
              <PhaseIndicator label="Rewrite" active={phase === 'rewriting'} done={['validating', 'recritiquing', 'rewriting2', 'validating2'].includes(phase)} />
              <span className="text-muted-foreground">&rarr;</span>
              <PhaseIndicator label="Validate" active={phase === 'validating'} done={['recritiquing', 'rewriting2', 'validating2'].includes(phase)} />
              {extremePhases && (
                <>
                  <span className="text-muted-foreground">&rarr;</span>
                  <PhaseIndicator label="Re-Critique" active={phase === 'recritiquing'} done={['rewriting2', 'validating2'].includes(phase)} />
                  <span className="text-muted-foreground">&rarr;</span>
                  <PhaseIndicator label="Rewrite 2" active={phase === 'rewriting2'} done={phase === 'validating2'} />
                  <span className="text-muted-foreground">&rarr;</span>
                  <PhaseIndicator label="Final Check" active={phase === 'validating2'} done={false} />
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={!hasCriticAnalysis || isGenerating}
            onClick={() => handleGenerate(false)}
          >
            {isGenerating && !isExtreme ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                {phaseMessage || 'Working...'}
              </>
            ) : rewriteText ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Generate Full Rewrite
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={!hasCriticAnalysis || isGenerating}
            onClick={() => handleGenerate(true)}
          >
            {isGenerating && isExtreme ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                {phaseMessage || 'Working...'}
              </>
            ) : (
              <>
                <Flame className="h-3.5 w-3.5 mr-1" />
                Extreme Rewrite
              </>
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          <strong>Extreme Rewrite</strong> runs the full rewrite, then re-critiques the result and rewrites again. Higher quality, ~5x token cost.
        </p>
      </div>

      {/* Validation report */}
      {displayValidation && (
        <ValidationReport
          validation={displayValidation}
          label={finalValidation ? 'Final Supervisor Report' : 'Supervisor Report'}
        />
      )}

      {/* Side-by-side view */}
      {(rewriteText || isGenerating) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Original */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b">
              <h3 className="text-sm font-semibold">Original Script</h3>
            </div>
            <div className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {scriptText}
              </pre>
            </div>
          </div>

          {/* Rewrite */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">AI Rewrite</h3>
                {(phase === 'rewriting' || phase === 'rewriting2') && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </div>
              {rewriteText && !isGenerating && (
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    disabled={exportingPdf}
                    onClick={() => handleExport('pdf')}
                  >
                    {exportingPdf ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    disabled={exportingDocx}
                    onClick={() => handleExport('docx')}
                  >
                    {exportingDocx ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                    DOCX
                  </Button>
                </div>
              )}
            </div>
            <div ref={scrollRef} className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {rewriteText || phaseMessage || 'Generating...'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PhaseIndicator({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 ${active ? 'text-blue-600 font-medium' : done ? 'text-green-600' : 'text-muted-foreground'}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${active ? 'bg-blue-500 animate-pulse' : done ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
      {label}
    </span>
  );
}

function ValidationReport({ validation, label }: { validation: ValidationData; label: string }) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{label}</h3>
        <Badge variant={validation.overallScore >= 8 ? 'default' : validation.overallScore >= 5 ? 'secondary' : 'destructive'}>
          Score: {validation.overallScore}/10
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{validation.summary}</p>

      {validation.strengths.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-green-700 flex items-center gap-1 mb-1">
            <CheckCircle2 className="h-3 w-3" /> Strengths
          </h4>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {validation.strengths.map((s, i) => <li key={i}>+ {s}</li>)}
          </ul>
        </div>
      )}

      {validation.characterDrift.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-amber-700 flex items-center gap-1 mb-1">
            <AlertTriangle className="h-3 w-3" /> Character Drift ({validation.characterDrift.length})
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            {validation.characterDrift.map((d, i) => (
              <li key={i}>
                <span className="font-medium">{d.character}</span> ({d.severity}) — {d.issue}
                {d.location && <span className="text-muted-foreground/60"> [{d.location}]</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation.aiWritingFlags.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-amber-700 flex items-center gap-1 mb-1">
            <AlertTriangle className="h-3 w-3" /> AI Writing Flags ({validation.aiWritingFlags.length})
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            {validation.aiWritingFlags.map((f, i) => (
              <li key={i}>
                <Badge variant="outline" className="text-[10px] mr-1">{f.category}</Badge>
                {f.example && <span className="italic">&ldquo;{f.example}&rdquo;</span>}
                {f.location && <span className="text-muted-foreground/60"> [{f.location}]</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation.lostBeats.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-red-700 flex items-center gap-1 mb-1">
            <AlertTriangle className="h-3 w-3" /> Lost Story Beats ({validation.lostBeats.length})
          </h4>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {validation.lostBeats.map((b, i) => (
              <li key={i}>Beat #{b.beatNumber} — {b.issue}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.toneShifts.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-amber-700 flex items-center gap-1 mb-1">
            <AlertTriangle className="h-3 w-3" /> Tone Shifts ({validation.toneShifts.length})
          </h4>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {validation.toneShifts.map((t, i) => (
              <li key={i}>{t.issue} {t.location && <span className="text-muted-foreground/60">[{t.location}]</span>}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
