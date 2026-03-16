'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PROJECT_TYPES } from '@/lib/types/project-types';
import { PlaceholderPage } from '@/components/placeholder-page';

interface ProjectTypeTabsProps {
  children: React.ReactNode;
}

export function ProjectTypeTabs({ children }: ProjectTypeTabsProps) {
  const typeKeys = Object.keys(PROJECT_TYPES);

  return (
    <Tabs defaultValue="documentary" className="w-full">
      <TabsList className="w-full justify-start">
        {typeKeys.map((key) => (
          <TabsTrigger key={key} value={key}>
            {PROJECT_TYPES[key].label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="documentary">{children}</TabsContent>

      {typeKeys
        .filter((key) => key !== 'documentary')
        .map((key) => (
          <TabsContent key={key} value={key}>
            <PlaceholderPage
              heading="Coming Soon"
              body="This project type is not yet available. Documentary analysis is ready to use."
            />
          </TabsContent>
        ))}
    </Tabs>
  );
}
