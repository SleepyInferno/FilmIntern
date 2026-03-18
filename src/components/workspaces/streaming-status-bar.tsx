'use client';

export function StreamingStatusBar({ currentSection }: { currentSection: string | null }) {
  if (currentSection === null) return null;

  return (
    <div className="flex items-center gap-2 bg-muted rounded-lg py-2 px-4 mb-6">
      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
      <span className="text-sm text-muted-foreground">{currentSection}</span>
    </div>
  );
}
