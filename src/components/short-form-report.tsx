'use client';

import type { ShortFormAnalysis } from '@/lib/ai/schemas/short-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ShortFormReportProps {
  data: Partial<ShortFormAnalysis> | null;
  isStreaming: boolean;
}

function RatingBadge({ value }: { value: string }) {
  switch (value) {
    case 'scroll-stopping':
    case 'crystal-clear':
    case 'compelling':
    case 'strong-close':
    case 'tight':
    case 'emotion-led':
      return (
        <Badge className="bg-green-600 text-white hover:bg-green-600/80">
          {value}
        </Badge>
      );
    case 'adequate':
    case 'mostly-clear':
    case 'well-paced':
    case 'balanced':
      return <Badge variant="secondary">{value}</Badge>;
    case 'weak':
    case 'muddled':
    case 'unclear':
    case 'slow':
    case 'uneven':
    case 'buried':
    case 'missing':
    case 'none':
    case 'neither':
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

export function ShortFormReport({ data, isStreaming }: ShortFormReportProps) {
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
          Analyzing your short-form content...
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
                <span className="text-sm font-medium">Format:</span>
                <Badge variant="outline">{data.summary.detectedFormat}</Badge>
              </div>
              {data.summary.estimatedDuration && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Estimated Duration:
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {data.summary.estimatedDuration}
                  </span>
                </div>
              )}
              {data.summary.primaryObjective && (
                <div>
                  <p className="text-sm font-medium mb-1">
                    Primary Objective
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.summary.primaryObjective}
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
            Hook Strength
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.hookStrength ? (
            <SectionSkeleton />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {data.hookStrength.opening}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Hook Rating:</span>
                <RatingBadge value={data.hookStrength.hookRating} />
              </div>
              {data.hookStrength.timeToHook && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Time to Hook:</span>
                  <span className="text-sm text-muted-foreground">
                    {data.hookStrength.timeToHook}
                  </span>
                </div>
              )}
              {data.hookStrength.suggestions &&
                data.hookStrength.suggestions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Suggestions</p>
                    <ul className="space-y-1">
                      {data.hookStrength.suggestions.map((s, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground"
                        >
                          &bull; {s}
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
          <CardTitle className="text-xl font-semibold">Pacing</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.pacing ? (
            <SectionSkeleton />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Overall:</span>
                <RatingBadge value={data.pacing.overall} />
              </div>
              <p className="text-sm text-muted-foreground">
                {data.pacing.assessment}
              </p>
              {data.pacing.deadSpots && data.pacing.deadSpots.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Dead Spots</p>
                  <ul className="space-y-1">
                    {data.pacing.deadSpots.map((spot, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground"
                      >
                        &bull; {spot}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.pacing.recommendations &&
                data.pacing.recommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Recommendations
                    </p>
                    <ul className="space-y-1">
                      {data.pacing.recommendations.map((rec, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground"
                        >
                          &bull; {rec}
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
          <CardTitle className="text-xl font-semibold">
            Messaging Clarity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.messagingClarity ? (
            <SectionSkeleton />
          ) : (
            <div className="space-y-3">
              {data.messagingClarity.primaryMessage && (
                <div>
                  <p className="text-sm font-medium mb-1">Primary Message</p>
                  <p className="text-sm text-muted-foreground">
                    {data.messagingClarity.primaryMessage}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Clarity:</span>
                <RatingBadge value={data.messagingClarity.clarity} />
              </div>
              {data.messagingClarity.messageRetention && (
                <div>
                  <p className="text-sm font-medium mb-1">
                    Message Retention
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.messagingClarity.messageRetention}
                  </p>
                </div>
              )}
              {data.messagingClarity.improvements &&
                data.messagingClarity.improvements.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Improvements</p>
                    <ul className="space-y-1">
                      {data.messagingClarity.improvements.map((imp, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground"
                        >
                          &bull; {imp}
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
          <CardTitle className="text-xl font-semibold">
            CTA Effectiveness
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.ctaEffectiveness ? (
            <SectionSkeleton />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Has CTA:</span>
                <span className="text-sm text-muted-foreground">
                  {data.ctaEffectiveness.hasCta ? 'Yes' : 'No'}
                </span>
              </div>
              {data.ctaEffectiveness.ctaText && (
                <div>
                  <p className="text-sm font-medium mb-1">CTA Text</p>
                  <p className="text-sm italic text-muted-foreground">
                    &ldquo;{data.ctaEffectiveness.ctaText}&rdquo;
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Placement:</span>
                <RatingBadge value={data.ctaEffectiveness.placement} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Urgency:</span>
                <RatingBadge value={data.ctaEffectiveness.urgency} />
              </div>
              {data.ctaEffectiveness.suggestions &&
                data.ctaEffectiveness.suggestions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Suggestions</p>
                    <ul className="space-y-1">
                      {data.ctaEffectiveness.suggestions.map((s, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground"
                        >
                          &bull; {s}
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
          <CardTitle className="text-xl font-semibold">
            Emotional / Rational Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.emotionalRationalBalance ? (
            <SectionSkeleton />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Balance:</span>
                <RatingBadge value={data.emotionalRationalBalance.balance} />
              </div>
              <p className="text-sm text-muted-foreground">
                {data.emotionalRationalBalance.assessment}
              </p>
              {data.emotionalRationalBalance.emotionalMoments &&
                data.emotionalRationalBalance.emotionalMoments.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Emotional Moments
                    </p>
                    <ul className="space-y-1">
                      {data.emotionalRationalBalance.emotionalMoments.map(
                        (m, i) => (
                          <li
                            key={i}
                            className="text-sm text-muted-foreground"
                          >
                            &bull; {m}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              {data.emotionalRationalBalance.rationalElements &&
                data.emotionalRationalBalance.rationalElements.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Rational Elements
                    </p>
                    <ul className="space-y-1">
                      {data.emotionalRationalBalance.rationalElements.map(
                        (r, i) => (
                          <li
                            key={i}
                            className="text-sm text-muted-foreground"
                          >
                            &bull; {r}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
