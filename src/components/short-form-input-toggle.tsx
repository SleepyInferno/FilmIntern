'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ShortFormInputToggleProps {
  value: string;
  onChange: (value: string) => void;
}

export function ShortFormInputToggle({
  value,
  onChange,
}: ShortFormInputToggleProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">Input Type</p>
      <Tabs value={value} onValueChange={(v) => onChange(v as string)}>
        <TabsList>
          <TabsTrigger value="script-storyboard">
            Script / Storyboard
          </TabsTrigger>
          <TabsTrigger value="vo-transcript">VO Transcript</TabsTrigger>
          <TabsTrigger value="rough-outline">Rough Outline</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
