'use client';

import type { CorporateAnalysis } from '@/lib/ai/schemas/corporate';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface CorporateReportProps {
  data: Partial<CorporateAnalysis> | null;
  isStreaming: boolean;
}

function RatingBadge({ value }: { value: string }) {
  switch (value) {
    case 'hero-quote':
    case 'must-use':
    case 'highly-quotable':
    case 'on-message':
    case 'unified':
      return (
        <Badge className="bg-green-600 text-white hover:bg-green-600/80">
          {value}
        </Badge>
      );
    case 'strong':
    case 'adequate':
    case 'mostly-consistent':
    case 'partially-aligned':
      return <Badge variant="secondary">{value}</Badge>;
    case 'supporting':
    case 'needs-coaching':
    case 'off-message':
    case 'mixed-signals':
    case 'contradictory':
      return <Badge variant="destructive">{value}</Badge>;
    default:
      return <Badge variant="outline">{value}</Badge>;
  }
}

function usabilityBorderClass(usability: string): string {
  switch (usability) {
    case 'hero-quote':
      return 'border-green-600';
    case 'strong':
      return 'border-muted-foreground';
    case 'supporting':
      return 'border-border';
    default:
      return 'border-border';
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

export function CorporateReport({ data, isStreaming }: CorporateReportProps) {
  if (!data && !isStreaming) {
    return (
      <p className="text-sm text-muted-foreground">
        Upload a transcript and click Run Analysis
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {isStreaming && (
        <p className="text-sm text-muted-foreground">
          Analyzing your corporate material...
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.summary ? (
            <SectionSkeleton />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {data.summary.overview}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Speakers:</span>
                <span className="text-sm text-muted-foreground">
                  {data.summary.speakerCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Context:</span>
                <Badge variant="outline">{data.summary.primaryContext}</Badge>
              </div>
              {data.summary.dominantMessages && (
                <div>
                  <p className="text-sm font-medium mb-1">Dominant Messages</p>
                  <ul className="space-y-1">
                    {data.summary.dominantMessages.map((msg, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground"
                      >
                        &bull; {msg}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Soundbites</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.soundbites ? (
            <SectionSkeleton />
          ) : (
            <div className="space-y-4">
              {data.soundbites.map((sb, i) => (
                <div
                  key={i}
                  className={`border-l-[3px] pl-4 py-2 ${usabilityBorderClass(sb.usability)}`}
                >
                  <p className="italic text-sm">
                    &ldquo;{sb.quote}&rdquo;
                  </p>
                  <p className="text-sm font-semibold mt-1">{sb.speaker}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {sb.context}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{sb.category}</Badge>
                    <RatingBadge value={sb.usability} />
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
            Messaging Themes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.messagingThemes ? (
            <SectionSkeleton />
          ) : (
            <div className="space-y-4">
              {data.messagingThemes.map((theme, i) => (
                <div
                  key={i}
                  className="border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{theme.theme}</p>
                    <RatingBadge value={theme.consistency} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {theme.description}
                  </p>
                  <div className="space-y-1">
                    {theme.evidence.map((ev, j) => (
                      <p
                        key={j}
                        className="text-sm italic text-muted-foreground border-l-2 border-muted pl-3"
                      >
                        &ldquo;{ev}&rdquo;
                      </p>
                    ))}
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
            Speaker Effectiveness
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.speakerEffectiveness ? (
            <SectionSkeleton />
          ) : (
            <div className="space-y-4">
              {data.speakerEffectiveness.map((speaker, i) => (
                <div
                  key={i}
                  className="border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <p className="font-medium mb-2">{speaker.speaker}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div>
                      <p className="text-xs font-medium mb-1">Strengths</p>
                      <ul className="space-y-0.5">
                        {speaker.strengths.map((s, j) => (
                          <li
                            key={j}
                            className="text-xs text-muted-foreground flex items-start gap-1"
                          >
                            <span className="text-green-600">&#9679;</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1">
                        Areas for Improvement
                      </p>
                      <ul className="space-y-0.5">
                        {speaker.areasForImprovement.map((w, j) => (
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
                  <div className="flex gap-2">
                    <RatingBadge value={speaker.quotability} />
                    <RatingBadge value={speaker.onMessageScore} />
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
            Editorial Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.editorialNotes ? (
            <SectionSkeleton />
          ) : (
            <div className="space-y-3">
              {data.editorialNotes.recommendedNarrative && (
                <div>
                  <p className="text-sm font-medium mb-1">
                    Recommended Narrative
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.editorialNotes.recommendedNarrative}
                  </p>
                </div>
              )}
              {data.editorialNotes.messagingGaps &&
                data.editorialNotes.messagingGaps.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Messaging Gaps</p>
                    <ul className="space-y-1">
                      {data.editorialNotes.messagingGaps.map((gap, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground"
                        >
                          &bull; {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              {data.editorialNotes.suggestedCuts && (
                <div>
                  <p className="text-sm font-medium mb-1">Suggested Cuts</p>
                  <p className="text-sm text-muted-foreground">
                    {data.editorialNotes.suggestedCuts}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
