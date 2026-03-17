'use client';

import type { NarrativeAnalysis } from '@/lib/ai/schemas/narrative';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
      return <Badge variant="destructive">{value}</Badge>;
    case 'missing':
      return (
        <Badge className="bg-gray-400 text-white hover:bg-gray-400/80">
          {value}
        </Badge>
      );
    default:
      return <Badge variant="outline">{value}</Badge>;
  }
}

function SectionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
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
    <div className="space-y-6">
      {isStreaming && (
        <p className="text-sm text-muted-foreground">
          Analyzing your script...
        </p>
      )}

      <Tabs defaultValue="structure">
        <TabsList>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="coverage">Coverage</TabsTrigger>
        </TabsList>

        <TabsContent value="structure">
          <div className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Story Beats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data?.storyStructure?.beats ? (
                  <SectionSkeleton />
                ) : (
                  <div className="space-y-4">
                    {data.storyStructure.beats.map((beat, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">
                            {formatBeatName(beat.name)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {beat.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Position: {beat.approximatePosition}
                          </p>
                        </div>
                        <EffectivenessBadge value={beat.effectiveness} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Pacing &amp; Tension
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data?.storyStructure ? (
                  <SectionSkeleton />
                ) : (
                  <div className="space-y-4">
                    {data.storyStructure.pacingAssessment && (
                      <div>
                        <p className="text-sm font-medium mb-1">Pacing</p>
                        <p className="text-sm text-muted-foreground">
                          {data.storyStructure.pacingAssessment}
                        </p>
                      </div>
                    )}
                    {data.storyStructure.tensionArc && (
                      <div>
                        <p className="text-sm font-medium mb-1">Tension Arc</p>
                        <p className="text-sm text-muted-foreground">
                          {data.storyStructure.tensionArc}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Structural Strengths &amp; Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data?.storyStructure?.structuralStrengths &&
                !data?.storyStructure?.structuralWeaknesses ? (
                  <SectionSkeleton />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium mb-2">Strengths</p>
                      <ul className="space-y-1">
                        {data.storyStructure?.structuralStrengths?.map(
                          (s, i) => (
                            <li
                              key={i}
                              className="text-sm text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-green-600 mt-1">
                                &#9679;
                              </span>
                              {s}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Weaknesses</p>
                      <ul className="space-y-1">
                        {data.storyStructure?.structuralWeaknesses?.map(
                          (w, i) => (
                            <li
                              key={i}
                              className="text-sm text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-red-600 mt-1">
                                &#9679;
                              </span>
                              {w}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="coverage">
          <div className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Characters
                </CardTitle>
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
                          <p className="font-medium">{char.name}</p>
                          <Badge variant="outline">{char.role}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {char.arcAssessment}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium mb-1">
                              Strengths
                            </p>
                            <ul className="space-y-0.5">
                              {char.strengths.map((s, j) => (
                                <li
                                  key={j}
                                  className="text-xs text-muted-foreground flex items-start gap-1"
                                >
                                  <span className="text-green-600">
                                    &#9679;
                                  </span>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-medium mb-1">
                              Weaknesses
                            </p>
                            <ul className="space-y-0.5">
                              {char.weaknesses.map((w, j) => (
                                <li
                                  key={j}
                                  className="text-xs text-muted-foreground flex items-start gap-1"
                                >
                                  <span className="text-red-600">&#9679;</span>
                                  {w}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Conflict
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data?.scriptCoverage?.conflictAssessment ? (
                  <SectionSkeleton />
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">
                        Primary Conflict
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {data.scriptCoverage.conflictAssessment.primary}
                      </p>
                    </div>
                    {data.scriptCoverage.conflictAssessment.secondary && (
                      <div>
                        <p className="text-sm font-medium mb-1">
                          Secondary Conflicts
                        </p>
                        <ul className="space-y-1">
                          {data.scriptCoverage.conflictAssessment.secondary.map(
                            (s, i) => (
                              <li
                                key={i}
                                className="text-sm text-muted-foreground"
                              >
                                &bull; {s}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Effectiveness:
                      </span>
                      <EffectivenessBadge
                        value={
                          data.scriptCoverage.conflictAssessment.effectiveness
                        }
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Dialogue
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data?.scriptCoverage?.dialogueQuality ? (
                  <SectionSkeleton />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Overall:</span>
                      <EffectivenessBadge
                        value={data.scriptCoverage.dialogueQuality.overall}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Strengths</p>
                        <ul className="space-y-1">
                          {data.scriptCoverage.dialogueQuality.strengths?.map(
                            (s, i) => (
                              <li
                                key={i}
                                className="text-sm text-muted-foreground flex items-start gap-1"
                              >
                                <span className="text-green-600">&#9679;</span>
                                {s}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Weaknesses</p>
                        <ul className="space-y-1">
                          {data.scriptCoverage.dialogueQuality.weaknesses?.map(
                            (w, i) => (
                              <li
                                key={i}
                                className="text-sm text-muted-foreground flex items-start gap-1"
                              >
                                <span className="text-red-600">&#9679;</span>
                                {w}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                    {data.scriptCoverage.dialogueQuality.notableLines &&
                      data.scriptCoverage.dialogueQuality.notableLines.length >
                        0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">
                            Notable Lines
                          </p>
                          <div className="space-y-1">
                            {data.scriptCoverage.dialogueQuality.notableLines.map(
                              (line, i) => (
                                <p
                                  key={i}
                                  className="text-sm italic text-muted-foreground"
                                >
                                  &ldquo;{line}&rdquo;
                                </p>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Marketability
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data?.scriptCoverage?.marketability ? (
                  <SectionSkeleton />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Logline Quality:
                      </span>
                      <EffectivenessBadge
                        value={
                          data.scriptCoverage.marketability.loglineQuality
                        }
                      />
                    </div>
                    {data.scriptCoverage.marketability.suggestedLogline && (
                      <div>
                        <p className="text-sm font-medium mb-1">
                          Suggested Logline
                        </p>
                        <p className="text-sm italic text-muted-foreground">
                          {data.scriptCoverage.marketability.suggestedLogline}
                        </p>
                      </div>
                    )}
                    {data.scriptCoverage.marketability.compTitles && (
                      <div>
                        <p className="text-sm font-medium mb-1">
                          Comp Titles
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {data.scriptCoverage.marketability.compTitles.map(
                            (title, i) => (
                              <Badge key={i} variant="outline">
                                {title}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Commercial Viability:
                      </span>
                      <EffectivenessBadge
                        value={
                          data.scriptCoverage.marketability.commercialViability
                        }
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Overall Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data?.scriptCoverage?.overallStrengths &&
                !data?.scriptCoverage?.overallWeaknesses ? (
                  <SectionSkeleton />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium mb-2">Strengths</p>
                      <ul className="space-y-1">
                        {data.scriptCoverage?.overallStrengths?.map((s, i) => (
                          <li
                            key={i}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <span className="text-green-600 mt-1">
                              &#9679;
                            </span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Weaknesses</p>
                      <ul className="space-y-1">
                        {data.scriptCoverage?.overallWeaknesses?.map((w, i) => (
                          <li
                            key={i}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <span className="text-red-600 mt-1">&#9679;</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
