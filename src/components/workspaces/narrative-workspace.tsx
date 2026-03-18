'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { NarrativeAnalysis } from '@/lib/ai/schemas/narrative';
import { EvaluationCard } from './evaluation-card';
import { WorkspaceHeader } from './workspace-header';
import { WorkspaceGrid } from './workspace-grid';
import { StreamingStatusBar } from './streaming-status-bar';
import { EffectivenessBadge } from './effectiveness-badge';
import { ShowMoreToggle } from './show-more-toggle';

interface NarrativeWorkspaceProps {
  data: Partial<NarrativeAnalysis> | null;
  isStreaming: boolean;
}

function formatBeatName(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function detectCurrentSection(data: Partial<NarrativeAnalysis> | null): string | null {
  if (!data) return 'Analyzing your material...';
  if (!data.scriptCoverage?.marketability) return 'Analyzing story structure...';
  if (!data.scriptCoverage?.characters) return 'Mapping story structure...';
  if (!data.scriptCoverage?.dialogueQuality) return 'Profiling characters...';
  if (!data.themes) return 'Assessing dialogue quality...';
  if (!data.developmentRecommendations) return 'Identifying themes...';
  if (!data.overallScore) return 'Calculating overall assessment...';
  return null;
}

export function NarrativeWorkspace({ data, isStreaming }: NarrativeWorkspaceProps) {
  const [expandedBeat, setExpandedBeat] = useState<number | null>(null);
  const [showAllCharacters, setShowAllCharacters] = useState(false);

  const characters = data?.scriptCoverage?.characters ?? [];
  const visibleCharacters = showAllCharacters ? characters : characters.slice(0, 3);

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Story Lab Workspace"
        projectType="Narrative Film"
        score={data?.overallScore}
      />

      {isStreaming && (
        <StreamingStatusBar currentSection={detectCurrentSection(data)} />
      )}

      {data?.storyAngle && (
        <div className="border-l-4 border-primary/60 pl-4 py-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Story Angle</p>
          <p className="text-sm italic">{data.storyAngle}</p>
        </div>
      )}

      <WorkspaceGrid>
        {/* Card 1: Logline & Premise */}
        <EvaluationCard
          title="Logline & Premise"
          ready={!!data?.scriptCoverage?.marketability}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Logline Quality:</span>
              <EffectivenessBadge value={data?.scriptCoverage?.marketability?.loglineQuality ?? ''} />
            </div>
            {data?.scriptCoverage?.marketability?.suggestedLogline && (
              <p className="text-sm italic text-muted-foreground border-l-2 border-primary/40 pl-3">
                {data.scriptCoverage.marketability.suggestedLogline}
              </p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Commercial Viability:</span>
              <EffectivenessBadge value={data?.scriptCoverage?.marketability?.commercialViability ?? ''} />
            </div>
          </div>
        </EvaluationCard>

        {/* Card 2: Story Structure */}
        <EvaluationCard
          title="Story Structure"
          ready={!!data?.storyStructure?.beats}
          className="md:col-span-2"
        >
          <div className="space-y-1">
            {data?.storyStructure?.beats?.map((beat, i) => (
              <div key={i}>
                <div
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5 gap-4"
                  onClick={() => setExpandedBeat(expandedBeat === i ? null : i)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {expandedBeat === i ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">{formatBeatName(beat.name)}</span>
                    <span className="text-xs text-muted-foreground">{beat.approximatePosition}</span>
                  </div>
                  <EffectivenessBadge value={beat.effectiveness} />
                </div>
                {expandedBeat === i && (
                  <p className="text-sm text-muted-foreground px-2 pb-2 pt-1 pl-8">
                    {beat.description}
                  </p>
                )}
              </div>
            ))}

            {(data?.storyStructure?.structuralStrengths?.length ||
              data?.storyStructure?.structuralWeaknesses?.length) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 mt-2 border-t border-border">
                {data?.storyStructure?.structuralStrengths?.length ? (
                  <div>
                    <p className="text-xs font-medium mb-1 text-green-500">Structural Strengths</p>
                    <ul className="space-y-1">
                      {data.storyStructure.structuralStrengths.map((s, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-green-500 mt-0.5">&#9679;</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {data?.storyStructure?.structuralWeaknesses?.length ? (
                  <div>
                    <p className="text-xs font-medium mb-1 text-red-400">Structural Weaknesses</p>
                    <ul className="space-y-1">
                      {data.storyStructure.structuralWeaknesses.map((w, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-red-400 mt-0.5">&#9679;</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </EvaluationCard>

        {/* Card 3: Character Arcs */}
        <EvaluationCard
          title="Character Arcs"
          ready={!!data?.scriptCoverage?.characters}
        >
          <div className="space-y-4">
            {visibleCharacters.map((char, i) => (
              <div key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">{char.name}</p>
                  <Badge variant="outline" className="text-xs">{char.roleFunction ?? char.role}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{char.arcAssessment}</p>
                {char.innerConflict && (
                  <p className="text-xs text-muted-foreground italic mb-2 border-l-2 border-primary/30 pl-2">{char.innerConflict}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <ul className="space-y-0.5">
                    {char.strengths.map((s, j) => (
                      <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5">&#9679;</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-0.5">
                    {char.weaknesses.map((w, j) => (
                      <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-red-400 mt-0.5">&#9679;</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
            <ShowMoreToggle
              totalCount={characters.length}
              visibleCount={3}
              expanded={showAllCharacters}
              onToggle={() => setShowAllCharacters(!showAllCharacters)}
            />
          </div>
        </EvaluationCard>

        {/* Card 4: Dialogue & Voice */}
        <EvaluationCard
          title="Dialogue & Voice"
          ready={!!data?.scriptCoverage?.dialogueQuality}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Overall:</span>
              <EffectivenessBadge value={data?.scriptCoverage?.dialogueQuality?.overall ?? ''} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="space-y-1">
                {data?.scriptCoverage?.dialogueQuality?.strengths?.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5">&#9679;</span>
                    {s}
                  </li>
                ))}
              </ul>
              <ul className="space-y-1">
                {data?.scriptCoverage?.dialogueQuality?.weaknesses?.map((w, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                    <span className="text-red-400 mt-0.5">&#9679;</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
            {data?.scriptCoverage?.dialogueQuality?.notableLines?.length ? (
              <div className="space-y-1 pt-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notable Lines</p>
                {data.scriptCoverage.dialogueQuality.notableLines.map((line, i) => (
                  <p key={i} className="text-sm italic text-muted-foreground border-l-2 border-primary/40 pl-3">
                    &ldquo;{line}&rdquo;
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </EvaluationCard>

        {/* Card 5: Theme & Resonance */}
        <EvaluationCard
          title="Theme & Resonance"
          ready={!!data?.themes}
        >
          <div className="space-y-3">
            {data?.themes?.centralThemes?.length ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Central Themes</p>
                <div className="flex flex-wrap gap-2">
                  {data.themes.centralThemes.map((theme, i) => (
                    <Badge key={i} variant="outline">{theme}</Badge>
                  ))}
                </div>
              </div>
            ) : null}
            {data?.themes?.emotionalResonance && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Emotional Resonance</p>
                <p className="text-sm text-muted-foreground">{data.themes.emotionalResonance}</p>
              </div>
            )}
            {data?.themes?.audienceImpact && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Audience Impact</p>
                <p className="text-sm text-muted-foreground">{data.themes.audienceImpact}</p>
              </div>
            )}
          </div>
        </EvaluationCard>

        {/* Card 6: Pacing & Tension */}
        <EvaluationCard
          title="Pacing & Tension"
          ready={!!(data?.storyStructure?.pacingAssessment || data?.storyStructure?.tensionArc)}
        >
          <div className="space-y-3">
            {data?.storyStructure?.pacingAssessment && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Pacing</p>
                <p className="text-sm text-muted-foreground">{data.storyStructure.pacingAssessment}</p>
              </div>
            )}
            {data?.storyStructure?.tensionArc && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Tension Arc</p>
                <p className="text-sm text-muted-foreground">{data.storyStructure.tensionArc}</p>
              </div>
            )}
          </div>
        </EvaluationCard>

        {/* Card 7: Genre & Comparables */}
        <EvaluationCard
          title="Genre & Comparables"
          ready={!!data?.scriptCoverage?.marketability}
        >
          <div className="space-y-3">
            {data?.scriptCoverage?.marketability?.compTitles?.length ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Comp Titles</p>
                <div className="flex flex-wrap gap-2">
                  {data.scriptCoverage.marketability.compTitles.map((title, i) => (
                    <Badge key={i} variant="outline">{title}</Badge>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Commercial Viability:</span>
              <EffectivenessBadge value={data?.scriptCoverage?.marketability?.commercialViability ?? ''} />
            </div>
            {data?.scriptCoverage?.conflictAssessment && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Primary Conflict</p>
                <p className="text-sm text-muted-foreground">{data.scriptCoverage.conflictAssessment.primary}</p>
                {data.scriptCoverage.conflictAssessment.secondary?.length ? (
                  <ul className="mt-1.5 space-y-0.5">
                    {data.scriptCoverage.conflictAssessment.secondary.map((s, i) => (
                      <li key={i} className="text-xs text-muted-foreground">&bull; {s}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </div>
        </EvaluationCard>

        {/* Card 8: Development Recommendations */}
        <EvaluationCard
          title="Development Recommendations"
          ready={!!(data?.developmentRecommendations || data?.scriptCoverage?.overallStrengths)}
        >
          <div className="space-y-4">
            {data?.developmentRecommendations?.length ? (
              <ol className="space-y-2">
                {data.developmentRecommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-muted-foreground">{rec}</p>
                  </li>
                ))}
              </ol>
            ) : null}
            {(data?.scriptCoverage?.overallStrengths?.length || data?.scriptCoverage?.overallWeaknesses?.length) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
                {data?.scriptCoverage?.overallStrengths?.length ? (
                  <div>
                    <p className="text-xs font-medium mb-1.5 text-green-500">Overall Strengths</p>
                    <ul className="space-y-1">
                      {data.scriptCoverage.overallStrengths.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">&#9679;</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {data?.scriptCoverage?.overallWeaknesses?.length ? (
                  <div>
                    <p className="text-xs font-medium mb-1.5 text-red-400">Overall Weaknesses</p>
                    <ul className="space-y-1">
                      {data.scriptCoverage.overallWeaknesses.map((w, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">&#9679;</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </EvaluationCard>
      </WorkspaceGrid>

      {data?.verdict && (
        <div className="border border-border rounded-lg p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Verdict</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(['concept', 'execution', 'dialogue', 'characters', 'marketability'] as const).map((key) =>
              data.verdict?.[key] ? (
                <div key={key}>
                  <p className="text-xs text-muted-foreground capitalize mb-0.5">{key}</p>
                  <p className="text-sm font-medium">{data.verdict[key]}</p>
                </div>
              ) : null
            )}
          </div>
          {data.verdict.overall && (
            <p className="text-sm text-muted-foreground pt-2 border-t border-border">{data.verdict.overall}</p>
          )}
        </div>
      )}
    </div>
  );
}
