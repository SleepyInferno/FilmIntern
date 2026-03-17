'use client';

import { useState } from 'react';
import { ProjectTypeTabs } from '@/components/project-type-tabs';
import { FileDropzone } from '@/components/file-dropzone';
import { ContentPreview } from '@/components/content-preview';
import { Button } from '@/components/ui/button';
import type { ParseResult } from '@/lib/parsers/txt-parser';

interface UploadData {
  text: string;
  metadata: ParseResult['metadata'];
}

export default function Home() {
  const [uploadData, setUploadData] = useState<UploadData | null>(null);

  return (
    <ProjectTypeTabs>
      <div className="space-y-6 py-6">
        <FileDropzone onFileUploaded={setUploadData} />

        {uploadData && (
          <>
            <ContentPreview
              text={uploadData.text}
              metadata={uploadData.metadata}
            />
            <Button
              size="lg"
              onClick={() => {
                alert('Analysis coming soon');
              }}
            >
              Run Analysis
            </Button>
          </>
        )}
      </div>
    </ProjectTypeTabs>
  );
}
