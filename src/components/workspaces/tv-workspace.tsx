'use client';

import { Badge } from '@/components/ui/badge';
import type { TvEpisodicAnalysis } from '@/lib/ai/schemas/tv-episodic';
import { EvaluationCard } from './evaluation-card';
import { WorkspaceHeader } from './workspace-header';
import { WorkspaceGrid } from './workspace-grid';
import { StreamingStatusBar } from './streaming-status-bar';
import { EffectivenessBadge } from './effectiveness-badge';

interface TvWorkspaceProps {
  data: Partial<TvEpisodicAnalysis> | null;
  isStreaming: boolean;
}

function detectCurrentSection(data: Partial<TvEpisodicAnalysis> | null): string | null {
  if (!data) return 'Analyzing your material...';
  if (!data.episodeAnalysis?.episodeArc) return 'Mapping story structure...';
  if (!data.seriesAnalysis) return 'Analyzing series potential...';
  if (!data.toneAndVoice) return 'Assessing tone and voice...';
  if (!data.overallScore) return 'Calculating overall assessment...';
  return null;
}

export function TvWorkspace({ data, isStreaming }: TvWorkspaceProps) {
  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Series Room Workspace"
        projectType="TV/Episodic"
        score={data?.overallScore}
      />

      {isStreaming && (
        <StreamingStatusBar currentSection={detectCurrentSection(data)} />
      )}

      <WorkspaceGrid>
        {/* Card 1: Episode Arc */}
        <EvaluationCard
          title="Episode Arc"
          ready={!!data?.episodeAnalysis?.episodeArc}
        >
          <div className="space-y-4">
            {data?.episodeAnalysis?.coldOpen && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cold Open</p>
                  <EffectivenessBadge value={data.episodeAnalysis.coldOpen.hookStrength} />
                </div>
                <p className="text-sm text-muted-foreground">{data.episodeAnalysis.coldOpen.description}</p>
              </div>
            )}
            {data?.episodeAnalysis?.episodeArc && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Setup</p>
                  <p className="text-sm text-muted-foreground">{data.episodeAnalysis.episodeArc.setup}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Escalation</p>
                  <p className="text-sm text-muted-foreground">{data.episodeAnalysis.episodeArc.escalation}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Resolution</p>
                  <p className="text-sm text-muted-foreground">{data.episodeAnalysis.episodeArc.resolution}</p>
                </div>
                {data.episodeAnalysis.episodeArc.cliffhanger && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Cliffhanger</p>
                    <p className="text-sm text-muted-foreground">{data.episodeAnalysis.episodeArc.cliffhanger}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Pacing:</span>
                  <EffectivenessBadge value={data.episodeAnalysis.episodeArc.pacing} />
                </div>
              </div>
            )}
          </div>
        </EvaluationCard>

        {/* Card 2: Series Structure */}
        <EvaluationCard
          title="Series Structure"
          ready={!!data?.seriesAnalysis}
        >
          <div className="space-y-4">
            {data?.seriesAnalysis?.premiseLongevity && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">Premise Longevity:</span>
                  <EffectivenessBadge value={data.seriesAnalysis.premiseLongevity.assessment} />
                </div>
                <p className="text-sm text-muted-foreground">{data.seriesAnalysis.premiseLongevity.reasoning}</p>
              </div>
            )}
            {data?.seriesAnalysis?.episodicVsSerial && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">Episodic vs Serial:</span>
                  <EffectivenessBadge value={data.seriesAnalysis.episodicVsSerial.balance} />
                </div>
                <p className="text-sm text-muted-foreground">{data.seriesAnalysis.episodicVsSerial.assessment}</p>
              </div>
            )}
            {data?.seriesAnalysis?.seasonArcPotential && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Season Arc Potential</p>
                <p className="text-sm text-muted-foreground mb-2">{data.seriesAnalysis.seasonArcPotential.suggestedArc}</p>
                {data.seriesAnalysis.seasonArcPotential.strengths?.length ? (
                  <div className="mb-1">
                    <p className="text-xs font-medium mb-1 text-green-500">Strengths</p>
                    <ul className="space-y-0.5">
                      {data.seriesAnalysis.seasonArcPotential.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-green-500 mt-0.5">&#9679;</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {data.seriesAnalysis.seasonArcPotential.concerns?.length ? (
                  <div>
                    <p className="text-xs font-medium mb-1 text-red-400">Concerns</p>
                    <ul className="space-y-0.5">
                      {data.seriesAnalysis.seasonArcPotential.concerns.map((c, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-red-400 mt-0.5">&#9679;</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </EvaluationCard>

        {/* Card 3: Character Development */}
        <EvaluationCard
          title="Character Development"
          ready={!!(data?.episodeAnalysis?.characterIntroductions?.length)}
        >
          <div className="space-y-4">
            {data?.episodeAnalysis?.characterIntroductions?.length ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Character Introductions</p>
                <div className="space-y-2">
                  {data.episodeAnalysis.characterIntroductions.map((char, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <p className="text-sm font-medium min-w-0">{char.character}</p>
                      <EffectivenessBadge value={char.effectiveness} />
                      <p className="text-xs text-muted-foreground">{char.introMethod}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {data?.episodeAnalysis?.storyStrands?.length ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Story Strands</p>
                <div className="space-y-3">
                  {data.episodeAnalysis.storyStrands.map((strand, i) => (
                    <div key={i} className="border-b border-border pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{strand.strand}</Badge>
                        <EffectivenessBadge value={strand.effectiveness} />
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{strand.description}</p>
                      {strand.characters?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {strand.characters.map((c, j) => (
                            <Badge key={j} variant="secondary" className="text-xs">{c}</Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </EvaluationCard>

        {/* Card 4: Tone & Voice */}
        <EvaluationCard
          title="Tone & Voice"
          ready={true}
        >
          {data?.toneAndVoice ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Tone:</span>
                <span className="text-sm text-muted-foreground">{data.toneAndVoice.tone}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Voice Consistency:</span>
                <EffectivenessBadge value={data.toneAndVoice.voiceConsistency} />
              </div>
              <p className="text-sm text-muted-foreground">{data.toneAndVoice.assessment}</p>
              {data.toneAndVoice.comparisons?.length ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Comparisons</p>
                  <div className="flex flex-wrap gap-2">
                    {data.toneAndVoice.comparisons.map((comp, i) => (
                      <Badge key={i} variant="outline">{comp}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Tone and voice data not available for this analysis</p>
          )}
        </EvaluationCard>

        {/* Card 5: Pilot Effectiveness */}
        <EvaluationCard
          title="Pilot Effectiveness"
          ready={true}
        >
          {data?.pilotEffectiveness ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">World Building:</span>
                <EffectivenessBadge value={data.pilotEffectiveness.worldBuilding} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Character Establishment:</span>
                <EffectivenessBadge value={data.pilotEffectiveness.characterEstablishment} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Hook Strength:</span>
                <EffectivenessBadge value={data.pilotEffectiveness.hookStrength} />
              </div>
              <p className="text-sm text-muted-foreground">{data.pilotEffectiveness.assessment}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Pilot effectiveness data not available for this analysis</p>
          )}
        </EvaluationCard>

        {/* Card 6: Franchise Potential */}
        <EvaluationCard
          title="Franchise Potential"
          ready={true}
        >
          {data?.franchisePotential ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Potential:</span>
                <EffectivenessBadge value={data.franchisePotential.potential} />
              </div>
              <p className="text-sm text-muted-foreground">{data.franchisePotential.assessment}</p>
              {data.franchisePotential.opportunities?.length ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Opportunities</p>
                  <ul className="space-y-1">
                    {data.franchisePotential.opportunities.map((opp, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                        <span className="mt-0.5">&bull;</span>
                        {opp}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Franchise potential data not available for this analysis</p>
          )}
        </EvaluationCard>
      </WorkspaceGrid>
    </div>
  );
}
