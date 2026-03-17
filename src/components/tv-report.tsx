'use client';

import type { TvEpisodicAnalysis } from '@/lib/ai/schemas/tv-episodic';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface TvReportProps {
  data: Partial<TvEpisodicAnalysis> | null;
  isStreaming: boolean;
}

function RatingBadge({ value }: { value: string }) {
  switch (value) {
    case 'strong':
    case 'compelling':
    case 'memorable':
    case 'multi-season':
    case 'tight':
      return (
        <Badge className="bg-green-600 text-white hover:bg-green-600/80">
          {value}
        </Badge>
      );
    case 'adequate':
    case 'serviceable':
    case 'moderate':
    case 'well-paced':
    case 'limited-series':
    case 'balanced':
      return <Badge variant="secondary">{value}</Badge>;
    case 'weak':
    case 'flat':
    case 'underdeveloped':
    case 'one-season':
    case 'questionable':
    case 'uneven':
    case 'slow':
      return <Badge variant="destructive">{value}</Badge>;
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

export function TvReport({ data, isStreaming }: TvReportProps) {
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

      <Tabs defaultValue="episode">
        <TabsList>
          <TabsTrigger value="episode">Episode Arc</TabsTrigger>
          <TabsTrigger value="series">Series Structure</TabsTrigger>
        </TabsList>

        <TabsContent value="episode">
          <div className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Cold Open
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data?.episodeAnalysis?.coldOpen ? (
                  <SectionSkeleton />
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {data.episodeAnalysis.coldOpen.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Hook Strength:
                      </span>
                      <RatingBadge
                        value={data.episodeAnalysis.coldOpen.hookStrength}
                      />
                    </div>
                    {data.episodeAnalysis.coldOpen.notes && (
                      <p className="text-sm text-muted-foreground">
                        {data.episodeAnalysis.coldOpen.notes}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Story Strands
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data?.episodeAnalysis?.storyStrands ? (
                  <SectionSkeleton />
                ) : (
                  <div className="space-y-4">
                    {data.episodeAnalysis.storyStrands.map((strand, i) => (
                      <div
                        key={i}
                        className="border-b border-border pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{strand.strand}</Badge>
                          <RatingBadge value={strand.effectiveness} />
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {strand.description}
                        </p>
                        {strand.characters && strand.characters.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {strand.characters.map((char, j) => (
                              <Badge key={j} variant="secondary">
                                {char}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Character Introductions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data?.episodeAnalysis?.characterIntroductions ? (
                  <SectionSkeleton />
                ) : (
                  <div className="space-y-3">
                    {data.episodeAnalysis.characterIntroductions.map(
                      (intro, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                        >
                          <div className="space-y-1">
                            <p className="font-medium">{intro.character}</p>
                            <p className="text-sm text-muted-foreground">
                              {intro.introMethod}
                            </p>
                          </div>
                          <RatingBadge value={intro.effectiveness} />
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Episode Arc
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data?.episodeAnalysis?.episodeArc ? (
                  <SectionSkeleton />
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Setup</p>
                      <p className="text-sm text-muted-foreground">
                        {data.episodeAnalysis.episodeArc.setup}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Escalation</p>
                      <p className="text-sm text-muted-foreground">
                        {data.episodeAnalysis.episodeArc.escalation}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Resolution</p>
                      <p className="text-sm text-muted-foreground">
                        {data.episodeAnalysis.episodeArc.resolution}
                      </p>
                    </div>
                    {data.episodeAnalysis.episodeArc.cliffhanger && (
                      <div>
                        <p className="text-sm font-medium mb-1">Cliffhanger</p>
                        <p className="text-sm text-muted-foreground">
                          {data.episodeAnalysis.episodeArc.cliffhanger}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Pacing:</span>
                      <RatingBadge
                        value={data.episodeAnalysis.episodeArc.pacing}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="series">
          <div className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Premise Longevity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data?.seriesAnalysis?.premiseLongevity ? (
                  <SectionSkeleton />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Assessment:</span>
                      <RatingBadge
                        value={
                          data.seriesAnalysis.premiseLongevity.assessment
                        }
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {data.seriesAnalysis.premiseLongevity.reasoning}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Serialized Hooks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data?.seriesAnalysis?.serializedHooks ? (
                  <SectionSkeleton />
                ) : (
                  <div className="space-y-3">
                    {data.seriesAnalysis.serializedHooks.map((hook, i) => (
                      <div
                        key={i}
                        className="border-b border-border pb-3 last:border-0 last:pb-0"
                      >
                        <p className="text-sm text-muted-foreground mb-2">
                          {hook.hook}
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="outline">{hook.type}</Badge>
                          <RatingBadge value={hook.sustainability} />
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
                  Episodic vs Serial Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data?.seriesAnalysis?.episodicVsSerial ? (
                  <SectionSkeleton />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Balance:</span>
                      <RatingBadge
                        value={data.seriesAnalysis.episodicVsSerial.balance}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {data.seriesAnalysis.episodicVsSerial.assessment}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Season Arc Potential
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data?.seriesAnalysis?.seasonArcPotential ? (
                  <SectionSkeleton />
                ) : (
                  <div className="space-y-3">
                    {data.seriesAnalysis.seasonArcPotential.suggestedArc && (
                      <div>
                        <p className="text-sm font-medium mb-1">
                          Suggested Arc
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {data.seriesAnalysis.seasonArcPotential.suggestedArc}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Strengths</p>
                        <ul className="space-y-1">
                          {data.seriesAnalysis.seasonArcPotential.strengths?.map(
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
                        <p className="text-sm font-medium mb-1">Concerns</p>
                        <ul className="space-y-1">
                          {data.seriesAnalysis.seasonArcPotential.concerns?.map(
                            (c, i) => (
                              <li
                                key={i}
                                className="text-sm text-muted-foreground flex items-start gap-1"
                              >
                                <span className="text-red-600">&#9679;</span>
                                {c}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
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
