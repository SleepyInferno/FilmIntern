'use client';

import type { NarrativeAnalysis } from '@/lib/ai/schemas/narrative';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface NarrativeReportProps {
  data: Partial<NarrativeAnalysis> | null;
  isStreaming: boolean;
}

function formatBeatName(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function EffectivenessBadge({ value }: { value: string }) {
  switch (value) {
    case 'strong':
    case 'compelling':
    case 'sharp':
    case 'high':
      return (
        <Badge className="bg-green-600 text-white hover:bg-green-600/80">
          {value}
        </Badge>
      );
    case 'adequate':
    case 'serviceable':
    case 'moderate':
      return <Badge variant="secondary">{value}</Badge>;
    case 'weak':
    case 'needs-work':
    case 'underdeveloped':
    case 'limited':
    case 'niche':
      return <Badge variant="destructive">{value}</Badge>;
    case 'missing':
      return (
        <Badge className="bg-muted-foreground text-white hover:bg-muted-foreground/80">
          {value}
        </Badge>
      );
    default:
      return <Badge variant="outline">{value}</Badge>;
  }
}

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

function CategoryLabel({ number, label }: { number: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
        {number}
      </span>
      <CardTitle className="text-base font-semibold">{label}</CardTitle>
    </div>
  );
}

export function NarrativeReport({ data, isStreaming }: NarrativeReportProps) {
  if (!data && !isStreaming) {
    return (
      <p className="text-sm text-muted-foreground">
        Upload a script and click Run Analysis
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {isStreaming && (
        <p className="text-sm text-muted-foreground">Analyzing your script...</p>
      )}

      {/* 1. Logline & Premise Clarity */}
      <Card>
        <CardHeader className="pb-2">
          <CategoryLabel number={1} label="Logline & Premise Clarity" />
        </CardHeader>
        <CardContent>
          {!data?.scriptCoverage?.marketability ? (
            <SectionSkeleton />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Logline Quality:</span>
                <EffectivenessBadge
                  value={data.scriptCoverage.marketability.loglineQuality}
                />
              </div>
              {data.scriptCoverage.marketability.suggestedLogline && (
                <p className="text-sm italic text-muted-foreground border-l-2 border-primary/40 pl-3">
                  {data.scriptCoverage.marketability.suggestedLogline}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Story Structure / Act Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CategoryLabel number={2} label="Story Structure / Act Breakdown" />
        </CardHeader>
        <CardContent>
          {!data?.storyStructure?.beats ? (
            <SectionSkeleton />
          ) : (
            <div className="space-y-3">
              {data.storyStructure.beats.map((beat, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0 gap-4"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-medium">{formatBeatName(beat.name)}</p>
                    <p className="text-sm text-muted-foreground">{beat.description}</p>
                    <p className="text-xs text-muted-foreground/70">
                      Position: {beat.approximatePosition}
                    </p>
                  </div>
                  <EffectivenessBadge value={beat.effectiveness} />
                </div>
              ))}
              {(data.storyStructure.structuralStrengths?.length ||
                data.storyStructure.structuralWeaknesses?.length) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {data.storyStructure.structuralStrengths?.length ? (
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
                  {data.storyStructure.structuralWeaknesses?.length ? (
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
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Character Arcs & Development */}
      <Card>
        <CardHeader className="pb-2">
          <CategoryLabel number={3} label="Character Arcs & Development" />
        </CardHeader>
        <CardContent>
          {!data?.scriptCoverage?.characters ? (
            <SectionSkeleton />
          ) : (
            <div className="space-y-4">
              {data.scriptCoverage.characters.map((char, i) => (
                <div
                  key={i}
                  className="border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{char.name}</p>
                    <Badge variant="outline" className="text-xs">{char.role}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{char.arcAssessment}</p>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Dialogue & Voice */}
      <Card>
        <CardHeader className="pb-2">
          <CategoryLabel number={4} label="Dialogue & Voice" />
        </CardHeader>
        <CardContent>
          {!data?.scriptCoverage?.dialogueQuality ? (
            <SectionSkeleton />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Overall:</span>
                <EffectivenessBadge value={data.scriptCoverage.dialogueQuality.overall} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="space-y-1">
                  {data.scriptCoverage.dialogueQuality.strengths?.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5">&#9679;</span>
                      {s}
                    </li>
                  ))}
                </ul>
                <ul className="space-y-1">
                  {data.scriptCoverage.dialogueQuality.weaknesses?.map((w, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5">&#9679;</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
              {data.scriptCoverage.dialogueQuality.notableLines?.length ? (
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
          )}
        </CardContent>
      </Card>

      {/* 5. Theme & Emotional Resonance */}
      <Card>
        <CardHeader className="pb-2">
          <CategoryLabel number={5} label="Theme & Emotional Resonance" />
        </CardHeader>
        <CardContent>
          {!data?.themes ? (
            <SectionSkeleton />
          ) : (
            <div className="space-y-3">
              {data.themes.centralThemes?.length ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Central Themes</p>
                  <div className="flex flex-wrap gap-2">
                    {data.themes.centralThemes.map((theme, i) => (
                      <Badge key={i} variant="outline">{theme}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              {data.themes.emotionalResonance && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Emotional Resonance</p>
                  <p className="text-sm text-muted-foreground">{data.themes.emotionalResonance}</p>
                </div>
              )}
              {data.themes.audienceImpact && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Audience Impact</p>
                  <p className="text-sm text-muted-foreground">{data.themes.audienceImpact}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. Pacing & Tension */}
      <Card>
        <CardHeader className="pb-2">
          <CategoryLabel number={6} label="Pacing & Tension" />
        </CardHeader>
        <CardContent>
          {!data?.storyStructure?.pacingAssessment && !data?.storyStructure?.tensionArc ? (
            <SectionSkeleton />
          ) : (
            <div className="space-y-3">
              {data.storyStructure?.pacingAssessment && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Pacing</p>
                  <p className="text-sm text-muted-foreground">{data.storyStructure.pacingAssessment}</p>
                </div>
              )}
              {data.storyStructure?.tensionArc && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Tension Arc</p>
                  <p className="text-sm text-muted-foreground">{data.storyStructure.tensionArc}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 7. Genre Positioning & Comparables */}
      <Card>
        <CardHeader className="pb-2">
          <CategoryLabel number={7} label="Genre Positioning & Comparables" />
        </CardHeader>
        <CardContent>
          {!data?.scriptCoverage?.marketability ? (
            <SectionSkeleton />
          ) : (
            <div className="space-y-3">
              {data.scriptCoverage.marketability.compTitles?.length ? (
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
                <EffectivenessBadge value={data.scriptCoverage.marketability.commercialViability} />
              </div>
              {data.scriptCoverage.conflictAssessment && (
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
          )}
        </CardContent>
      </Card>

      {/* 8. Development Recommendations */}
      <Card>
        <CardHeader className="pb-2">
          <CategoryLabel number={8} label="Development Recommendations" />
        </CardHeader>
        <CardContent>
          {!data?.developmentRecommendations && !data?.scriptCoverage?.overallStrengths ? (
            <SectionSkeleton />
          ) : (
            <div className="space-y-4">
              {data.developmentRecommendations?.length ? (
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
              {(data.scriptCoverage?.overallStrengths?.length || data.scriptCoverage?.overallWeaknesses?.length) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
                  {data.scriptCoverage?.overallStrengths?.length ? (
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
                  {data.scriptCoverage?.overallWeaknesses?.length ? (
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
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
