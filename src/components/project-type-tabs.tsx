'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PROJECT_TYPES } from '@/lib/types/project-types';

interface ProjectTypeTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export function ProjectTypeTabs({
  value,
  onValueChange,
  children,
}: ProjectTypeTabsProps) {
  const typeKeys = Object.keys(PROJECT_TYPES);

  return (
    <Tabs
      value={value}
      onValueChange={(v) => onValueChange(v as string)}
      className="w-full"
    >
      <TabsList className="w-full justify-start">
        {typeKeys.map((key) => (
          <TabsTrigger key={key} value={key}>
            {PROJECT_TYPES[key].label}
          </TabsTrigger>
        ))}
      </TabsList>

      {typeKeys.map((key) => (
        <TabsContent key={key} value={key}>
          {children}
        </TabsContent>
      ))}
    </Tabs>
  );
}
