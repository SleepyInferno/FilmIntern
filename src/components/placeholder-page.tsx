import { Card, CardContent } from '@/components/ui/card';

interface PlaceholderPageProps {
  heading: string;
  body: string;
}

export function PlaceholderPage({ heading, body }: PlaceholderPageProps) {
  return (
    <div className="flex items-center justify-center py-24">
      <Card className="max-w-md text-center">
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {heading}
          </h2>
          <p className="text-sm text-muted-foreground">{body}</p>
        </CardContent>
      </Card>
    </div>
  );
}
