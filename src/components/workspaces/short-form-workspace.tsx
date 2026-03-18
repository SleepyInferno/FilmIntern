'use client';

import type { ShortFormAnalysis } from '@/lib/ai/schemas/short-form';
import { EvaluationCard } from './evaluation-card';
import { WorkspaceHeader } from './workspace-header';
import { WorkspaceGrid } from './workspace-grid';
import { StreamingStatusBar } from './streaming-status-bar';
import { EffectivenessBadge } from './effectiveness-badge';

interface ShortFormWorkspaceProps {
  data: Partial<ShortFormAnalysis> | null;
  isStreaming: boolean;
}

function detectCurrentSection(data: Partial<ShortFormAnalysis> | null): string | null {
  if (!data) return 'Analyzing your material...';
  if (!data.hookStrength) return 'Assessing hook strength...';
  if (!data.pacing) return 'Evaluating pacing...';
  if (!data.messagingClarity) return 'Analyzing messaging clarity...';
  if (!data.ctaEffectiveness) return 'Evaluating call to action...';
  if (!data.emotionalRationalBalance) return 'Assessing emotional impact...';
  if (!data.overallScore) return 'Calculating overall assessment...';
  return null;
}

export function ShortFormWorkspace({ data, isStreaming }: ShortFormWorkspaceProps) {
  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Impact Lab Workspace"
        projectType="Short-Form/Branded"
        score={data?.overallScore}
      />

      {isStreaming && (
        <StreamingStatusBar currentSection={detectCurrentSection(data)} />
      )}

      <WorkspaceGrid>
        {/* Card 1: Hook Strength */}
        <EvaluationCard
          title="Hook Strength"
          ready={!!data?.hookStrength}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Rating:</span>
              <EffectivenessBadge value={data?.hookStrength?.hookRating ?? ''} />
            </div>
            {data?.hookStrength?.opening && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Opening</p>
                <p className="text-sm text-muted-foreground">{data.hookStrength.opening}</p>
              </div>
            )}
            {data?.hookStrength?.timeToHook && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Time to Hook:</span>
                <span className="text-sm text-muted-foreground">{data.hookStrength.timeToHook}</span>
              </div>
            )}
            {data?.hookStrength?.suggestions?.length ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Suggestions</p>
                <ul className="space-y-1">
                  {data.hookStrength.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                      <span className="mt-0.5">&bull;</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </EvaluationCard>

        {/* Card 2: Pacing */}
        <EvaluationCard
          title="Pacing"
          ready={!!data?.pacing}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Overall:</span>
              <EffectivenessBadge value={data?.pacing?.overall ?? ''} />
            </div>
            {data?.pacing?.assessment && (
              <p className="text-sm text-muted-foreground">{data.pacing.assessment}</p>
            )}
            {data?.pacing?.deadSpots?.length ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Dead Spots</p>
                <ul className="space-y-1">
                  {data.pacing.deadSpots.map((spot, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5">&#9679;</span>
                      {spot}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {data?.pacing?.recommendations?.length ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Recommendations</p>
                <ul className="space-y-1">
                  {data.pacing.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                      <span className="mt-0.5">&bull;</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </EvaluationCard>

        {/* Card 3: CTA Clarity */}
        <EvaluationCard
          title="CTA Clarity"
          ready={!!data?.ctaEffectiveness}
        >
          <div className="space-y-3">
            {data?.ctaEffectiveness && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Has CTA:</span>
                  <span className="text-sm text-muted-foreground">{data.ctaEffectiveness.hasCta ? 'Yes' : 'No'}</span>
                </div>
                {data.ctaEffectiveness.ctaText && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">CTA Text</p>
                    <p className="text-sm text-muted-foreground italic">&ldquo;{data.ctaEffectiveness.ctaText}&rdquo;</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Placement:</span>
                  <EffectivenessBadge value={data.ctaEffectiveness.placement} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Urgency:</span>
                  <EffectivenessBadge value={data.ctaEffectiveness.urgency} />
                </div>
                {data.ctaEffectiveness.suggestions?.length ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Suggestions</p>
                    <ul className="space-y-1">
                      {data.ctaEffectiveness.suggestions.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                          <span className="mt-0.5">&bull;</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </EvaluationCard>

        {/* Card 4: Brand Alignment */}
        <EvaluationCard
          title="Brand Alignment"
          ready={!!data?.messagingClarity}
        >
          <div className="space-y-3">
            {data?.messagingClarity?.primaryMessage && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Primary Message</p>
                <p className="text-sm text-muted-foreground">{data.messagingClarity.primaryMessage}</p>
              </div>
            )}
            {data?.messagingClarity?.clarity && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Clarity:</span>
                <EffectivenessBadge value={data.messagingClarity.clarity} />
              </div>
            )}
            {data?.messagingClarity?.messageRetention && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Message Retention</p>
                <p className="text-sm text-muted-foreground">{data.messagingClarity.messageRetention}</p>
              </div>
            )}
            {data?.messagingClarity?.improvements?.length ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Improvements</p>
                <ul className="space-y-1">
                  {data.messagingClarity.improvements.map((imp, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                      <span className="mt-0.5">&bull;</span>
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </EvaluationCard>

        {/* Card 5: Emotional Impact */}
        <EvaluationCard
          title="Emotional Impact"
          ready={!!data?.emotionalRationalBalance}
        >
          <div className="space-y-3">
            {data?.emotionalRationalBalance && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Balance:</span>
                  <EffectivenessBadge value={data.emotionalRationalBalance.balance} />
                </div>
                <p className="text-sm text-muted-foreground">{data.emotionalRationalBalance.assessment}</p>
                {data.emotionalRationalBalance.emotionalMoments?.length ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Emotional Moments</p>
                    <ul className="space-y-1">
                      {data.emotionalRationalBalance.emotionalMoments.map((moment, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                          <span className="mt-0.5">&bull;</span>
                          {moment}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {data.emotionalRationalBalance.rationalElements?.length ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Rational Elements</p>
                    <ul className="space-y-1">
                      {data.emotionalRationalBalance.rationalElements.map((el, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                          <span className="mt-0.5">&bull;</span>
                          {el}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </EvaluationCard>

        {/* Card 6: Audience Fit */}
        <EvaluationCard
          title="Audience Fit"
          ready={true}
        >
          {data?.audienceFit ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Primary Audience:</span>
                <span className="text-sm text-muted-foreground">{data.audienceFit.primaryAudience}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Fit Rating:</span>
                <EffectivenessBadge value={data.audienceFit.fitRating} />
              </div>
              <p className="text-sm text-muted-foreground">{data.audienceFit.assessment}</p>
              {data.audienceFit.suggestions?.length ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Suggestions</p>
                  <ul className="space-y-1">
                    {data.audienceFit.suggestions.map((s, i) => (
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
            <p className="text-sm text-muted-foreground">Audience fit data not available for this analysis</p>
          )}
        </EvaluationCard>
      </WorkspaceGrid>
    </div>
  );
}
