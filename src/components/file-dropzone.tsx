'use client';

import { useState, useCallback } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText } from 'lucide-react';
import type { ParseResult } from '@/lib/parsers/txt-parser';

interface FileDropzoneProps {
  onFileUploaded: (data: { text: string; metadata: ParseResult['metadata']; fdxSource?: string }) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropzone({ onFileUploaded }: FileDropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    filename: string;
    size: number;
    wordCount: number;
  } | null>(null);

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Upload failed. Check your file and try again.');
          setUploading(false);
          return;
        }

        setUploadedFile({
          filename: data.metadata.filename,
          size: data.metadata.size,
          wordCount: data.metadata.wordCount,
        });
        setUploading(false);
        onFileUploaded(data);
      } catch {
        setError('Upload failed. Check your file and try again.');
        setUploading(false);
      }
    },
    [onFileUploaded]
  );

  const handleRejection = useCallback((fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      setError('Unsupported file type. Accepted formats: .txt, .pdf, .fdx, .docx');
      setTimeout(() => setError(null), 3000);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/xml': ['.fdx'],
      'text/xml': ['.fdx'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDropAccepted: handleDrop,
    onDropRejected: handleRejection,
  });

  // After successful upload: compact file info bar
  if (uploadedFile) {
    return (
      <Card className="flex flex-row items-center gap-3 px-4 py-3">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">{uploadedFile.filename}</span>
        <Badge variant="outline">{formatFileSize(uploadedFile.size)}</Badge>
        <Badge variant="outline">{uploadedFile.wordCount} words</Badge>
      </Card>
    );
  }

  return (
    <div>
      <Card
        {...getRootProps()}
        className={`border-2 border-dashed min-h-[200px] flex flex-col items-center justify-center p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : error
              ? 'border-destructive'
              : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload
          className={`mx-auto h-10 w-10 text-muted-foreground mb-4 ${
            uploading ? 'animate-pulse' : ''
          }`}
        />
        <p className="text-lg font-medium">
          {uploading
            ? 'Uploading...'
            : isDragActive
              ? 'Drop your transcript here'
              : 'Drag & drop your transcript, or click to browse'}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Accepts .txt, .pdf, .fdx, .docx files up to 10MB
        </p>
      </Card>
      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </div>
  );
}
