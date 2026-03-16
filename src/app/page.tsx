import { ProjectTypeTabs } from '@/components/project-type-tabs';

export default function Home() {
  return (
    <ProjectTypeTabs>
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Documentary Analysis
          </h2>
          <p className="text-sm text-muted-foreground">
            Upload your transcript to get started.
          </p>
        </div>
      </div>
    </ProjectTypeTabs>
  );
}
