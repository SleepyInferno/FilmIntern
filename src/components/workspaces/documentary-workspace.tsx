'use client';

import { Badge } from '@/components/ui/badge';
import type { DocumentaryAnalysis } from '@/lib/ai/schemas/documentary';
import { EvaluationCard } from './evaluation-card';
import { WorkspaceHeader } from './workspace-header';
import { WorkspaceGrid } from './workspace-grid';
import { StreamingStatusBar } from './streaming-status-bar';
import { EffectivenessBadge } from './effectiveness-badge';

interface DocumentaryWorkspaceProps {
  data: Partial<DocumentaryAnalysis> | null;
  isStreaming: boolean;
}

function getMomentColor(type: string): string {
  switch (type) {
    case 'turning-point':
      return '#F43F5E';
    case 'emotional-peak':
      return '#F43F5E';
    case 'revelation':
      return '#F59E0B';
    case 'contradiction':
      return '#F97316';
    case 'humor':
      return '#10B981';
    default:
      return '#6B7280';
  }
}

function detectCurrentSection(data: Partial<DocumentaryAnalysis> | null): string | null {
  if (!data) return 'Analyzing your material...';
  if (!data.keyQuotes) return 'Extracting key quotes...';
  if (!data.recurringThemes) return 'Identifying themes...';
  if (!data.keyMoments) return 'Mapping key moments...';
  if (!data.subjectProfiles) return 'Profiling characters...';
  if (!data.storyArc) return 'Assessing story arc...';
  if (!data.overallScore) return 'Calculating overall assessment...';
  return null;
}

export function DocumentaryWorkspace({ data, isStreaming }: DocumentaryWorkspaceProps) {
  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Documentary Workspace"
        projectType="Documentary"
        score={data?.overallScore}
      />

      {isStreaming && (
        <StreamingStatusBar currentSection={detectCurrentSection(data)} />
      )}

      <WorkspaceGrid>
        {/* Card 1: Key Quotes */}
        <EvaluationCard
          title="Key Quotes"
          ready={!!(data?.keyQuotes && data.keyQuotes.length > 0)}
        >
          <div className="divide-y divide-border">
            {data?.keyQuotes?.map((q, i) => (
              <div key={i} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                <p className="text-sm italic text-muted-foreground border-l-2 border-primary/40 pl-3">
                  &ldquo;{q.quote}&rdquo;
                </p>
                <div className="flex items-center gap-2 pl-3">
                  <span className="text-xs text-muted-foreground">{q.speaker}</span>
                  <EffectivenessBadge value={q.usefulness} />
                </div>
              </div>
            ))}
          </div>
        </EvaluationCard>

        {/* Card 2: Recurring Themes */}
        <EvaluationCard
          title="Recurring Themes"
          ready={!!(data?.recurringThemes && data.recurringThemes.length > 0)}
        >
          <div className="space-y-4">
            {data?.recurringThemes?.map((theme, i) => (
              <div key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">{theme.theme}</p>
                  <EffectivenessBadge value={theme.frequency} />
                </div>
                <p className="text-sm text-muted-foreground mb-2">{theme.description}</p>
                {theme.evidence?.length ? (
                  <ul className="space-y-1">
                    {theme.evidence.map((e, j) => (
                      <li key={j} className="text-xs italic text-muted-foreground">
                        &ldquo;{e}&rdquo;
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </EvaluationCard>

        {/* Card 3: Key Moments */}
        <EvaluationCard
          title="Key Moments"
          ready={!!(data?.keyMoments && data.keyMoments.length > 0)}
        >
          <div className="space-y-3">
            {data?.keyMoments?.map((moment, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className="h-2 w-2 rounded-full shrink-0 mt-1.5"
                  style={{ backgroundColor: getMomentColor(moment.type) }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{moment.moment}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{moment.significance}</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">{moment.approximateLocation}</p>
                </div>
              </div>
            ))}
          </div>
        </EvaluationCard>

        {/* Card 4: Subject Profiles */}
        <EvaluationCard
          title="Subject Profiles"
          ready={data !== null && ('subjectProfiles' in (data ?? {}) || data?.keyQuotes !== undefined)}
        >
          {!data?.subjectProfiles ? (
            <p className="text-sm text-muted-foreground">
              Subject profile data not available for this analysis
            </p>
          ) : (
            <div className="space-y-4">
              {data.subjectProfiles.map((profile, i) => (
                <div key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium">{profile.name}</p>
                    <EffectivenessBadge value={profile.quotability} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{profile.role}</p>
                  <p className="text-sm text-muted-foreground">{profile.keyContribution}</p>
                </div>
              ))}
            </div>
          )}
        </EvaluationCard>

        {/* Card 5: Story Arc */}
        <EvaluationCard
          title="Story Arc"
          ready={data !== null && ('storyArc' in (data ?? {}) || data?.keyQuotes !== undefined)}
        >
          {!data?.storyArc ? (
            <p className="text-sm text-muted-foreground">
              Story arc data not available for this analysis
            </p>
          ) : (
            <div className="space-y-3">
              {data.storyArc.assessment && (
                <p className="text-sm text-muted-foreground">{data.storyArc.assessment}</p>
              )}
              {data.storyArc.suggestedStructure && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Suggested Structure</p>
                  <p className="text-sm text-muted-foreground">{data.storyArc.suggestedStructure}</p>
                </div>
              )}
              {(data.storyArc.strengths?.length || data.storyArc.gaps?.length) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
                  {data.storyArc.strengths?.length ? (
                    <div>
                      <p className="text-xs font-medium mb-1 text-green-500">Arc Strengths</p>
                      <ul className="space-y-1">
                        {data.storyArc.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-green-500 mt-0.5">&#9679;</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {data.storyArc.gaps?.length ? (
                    <div>
                      <p className="text-xs font-medium mb-1 text-red-400">Arc Gaps</p>
                      <ul className="space-y-1">
                        {data.storyArc.gaps.map((g, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-red-400 mt-0.5">&#9679;</span>
                            {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </EvaluationCard>

        {/* Card 6: Interview Gaps */}
        <EvaluationCard
          title="Interview Gaps"
          ready={!!data?.editorialNotes}
        >
          <div className="space-y-3">
            {data?.editorialNotes?.missingPerspectives?.length ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Missing Perspectives</p>
                <ul className="space-y-1">
                  {data.editorialNotes.missingPerspectives.map((p, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                      <span className="mt-0.5 shrink-0">&bull;</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {data?.editorialNotes?.narrativeThreads?.length ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Narrative Threads</p>
                <ul className="space-y-1">
                  {data.editorialNotes.narrativeThreads.map((t, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                      <span className="mt-0.5 shrink-0">&bull;</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {data?.editorialNotes?.suggestedStructure && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Suggested Structure</p>
                <p className="text-sm text-muted-foreground">{data.editorialNotes.suggestedStructure}</p>
              </div>
            )}
          </div>
        </EvaluationCard>
      </WorkspaceGrid>
    </div>
  );
}
