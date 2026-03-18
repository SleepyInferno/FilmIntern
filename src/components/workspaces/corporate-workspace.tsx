'use client';

import { Badge } from '@/components/ui/badge';
import type { CorporateAnalysis } from '@/lib/ai/schemas/corporate';
import { EvaluationCard } from './evaluation-card';
import { WorkspaceHeader } from './workspace-header';
import { WorkspaceGrid } from './workspace-grid';
import { StreamingStatusBar } from './streaming-status-bar';
import { EffectivenessBadge } from './effectiveness-badge';

interface CorporateWorkspaceProps {
  data: Partial<CorporateAnalysis> | null;
  isStreaming: boolean;
}

function detectCurrentSection(data: Partial<CorporateAnalysis> | null): string | null {
  if (!data) return 'Analyzing your material...';
  if (!data.soundbites) return 'Extracting key quotes...';
  if (!data.messagingThemes) return 'Identifying themes...';
  if (!data.speakerEffectiveness) return 'Assessing spokespeople...';
  if (!data.spokespersonAssessment) return 'Generating recommendations...';
  if (!data.overallScore) return 'Calculating overall assessment...';
  return null;
}

export function CorporateWorkspace({ data, isStreaming }: CorporateWorkspaceProps) {
  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Media Prep Workspace"
        projectType="Corporate Interview"
        score={data?.overallScore}
      />

      {isStreaming && (
        <StreamingStatusBar currentSection={detectCurrentSection(data)} />
      )}

      <WorkspaceGrid>
        {/* Card 1: Soundbites */}
        <EvaluationCard
          title="Soundbites"
          ready={!!(data?.soundbites?.length)}
        >
          <div className="space-y-4">
            {data?.soundbites?.map((bite, i) => (
              <div key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                <p className="text-sm italic text-muted-foreground border-l-2 border-primary/40 pl-3 mb-2">
                  &ldquo;{bite.quote}&rdquo;
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium">{bite.speaker}</span>
                  <Badge variant="outline" className="text-xs">{bite.category}</Badge>
                  <EffectivenessBadge value={bite.usability} />
                </div>
                {bite.context && (
                  <p className="text-xs text-muted-foreground mt-1">{bite.context}</p>
                )}
              </div>
            ))}
          </div>
        </EvaluationCard>

        {/* Card 2: Key Messages */}
        <EvaluationCard
          title="Key Messages"
          ready={!!(data?.messagingThemes?.length)}
        >
          <div className="space-y-4">
            {data?.messagingThemes?.map((theme, i) => (
              <div key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">{theme.theme}</p>
                  <EffectivenessBadge value={theme.consistency} />
                </div>
                <p className="text-sm text-muted-foreground mb-2">{theme.description}</p>
                {theme.evidence?.length ? (
                  <ul className="space-y-1">
                    {theme.evidence.map((quote, j) => (
                      <li key={j} className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                        &ldquo;{quote}&rdquo;
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </EvaluationCard>

        {/* Card 3: Spokesperson Assessment */}
        <EvaluationCard
          title="Spokesperson Assessment"
          ready={true}
        >
          {data?.spokespersonAssessment ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Overall Readiness:</span>
                <EffectivenessBadge value={data.spokespersonAssessment.overallReadiness} />
              </div>
              <p className="text-sm text-muted-foreground">{data.spokespersonAssessment.summary}</p>
              {data.spokespersonAssessment.topPerformer && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top Performer:</span>
                  <span className="text-sm">{data.spokespersonAssessment.topPerformer}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Spokesperson assessment not available for this analysis</p>
          )}
        </EvaluationCard>

        {/* Card 4: Audience Alignment */}
        <EvaluationCard
          title="Audience Alignment"
          ready={true}
        >
          {data?.audienceAlignment ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Target Audience:</span>
                <span className="text-sm text-muted-foreground">{data.audienceAlignment.targetAudience}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Alignment:</span>
                <EffectivenessBadge value={data.audienceAlignment.alignmentRating} />
              </div>
              <p className="text-sm text-muted-foreground">{data.audienceAlignment.assessment}</p>
              {data.audienceAlignment.suggestions?.length ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Suggestions</p>
                  <ul className="space-y-1">
                    {data.audienceAlignment.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                        <span className="mt-0.5">&bull;</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Audience alignment data not available for this analysis</p>
          )}
        </EvaluationCard>

        {/* Card 5: Message Consistency */}
        <EvaluationCard
          title="Message Consistency"
          ready={true}
        >
          {data?.messageConsistency ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Consistency:</span>
                <EffectivenessBadge value={data.messageConsistency.consistencyRating} />
              </div>
              <p className="text-sm text-muted-foreground">{data.messageConsistency.assessment}</p>
              {data.messageConsistency.keyConflicts?.length ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Key Conflicts</p>
                  <ul className="space-y-1">
                    {data.messageConsistency.keyConflicts.map((conflict, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                        <span className="text-red-400 mt-0.5">&#9679;</span>
                        {conflict}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Message consistency data not available for this analysis</p>
          )}
        </EvaluationCard>

        {/* Card 6: Recommendations */}
        <EvaluationCard
          title="Recommendations"
          ready={!!data?.editorialNotes}
        >
          <div className="space-y-4">
            {data?.editorialNotes?.recommendedNarrative && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Recommended Narrative</p>
                <p className="text-sm text-muted-foreground">{data.editorialNotes.recommendedNarrative}</p>
              </div>
            )}
            {data?.editorialNotes?.messagingGaps?.length ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Messaging Gaps</p>
                <ul className="space-y-1">
                  {data.editorialNotes.messagingGaps.map((gap, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                      <span className="mt-0.5">&bull;</span>
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {data?.editorialNotes?.suggestedCuts && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Suggested Cuts</p>
                <p className="text-sm text-muted-foreground">{data.editorialNotes.suggestedCuts}</p>
              </div>
            )}
          </div>
        </EvaluationCard>
      </WorkspaceGrid>
    </div>
  );
}
