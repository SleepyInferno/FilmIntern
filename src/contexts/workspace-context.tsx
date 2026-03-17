'use client';

import {
  createContext,
  useContext,
  useState,
  useMemo,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from 'react';
import type { ParseResult } from '@/lib/parsers/txt-parser';
import type { GeneratedDocument } from '@/lib/documents/types';

export interface UploadData {
  text: string;
  metadata: ParseResult['metadata'];
}

interface WorkspaceState {
  projectType: string;
  inputType: string;
  uploadData: UploadData | null;
  analysisData: Record<string, unknown> | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  reportDocument: GeneratedDocument | null;
  generatedDocuments: GeneratedDocument[];
  activeDocumentId: string;
  title: string;
  writtenBy: string;
}

interface WorkspaceActions {
  setProjectType: Dispatch<SetStateAction<string>>;
  setInputType: Dispatch<SetStateAction<string>>;
  setUploadData: Dispatch<SetStateAction<UploadData | null>>;
  setAnalysisData: Dispatch<SetStateAction<Record<string, unknown> | null>>;
  setIsAnalyzing: Dispatch<SetStateAction<boolean>>;
  setAnalysisError: Dispatch<SetStateAction<string | null>>;
  setReportDocument: Dispatch<SetStateAction<GeneratedDocument | null>>;
  setGeneratedDocuments: Dispatch<SetStateAction<GeneratedDocument[]>>;
  setActiveDocumentId: Dispatch<SetStateAction<string>>;
  setTitle: Dispatch<SetStateAction<string>>;
  setWrittenBy: Dispatch<SetStateAction<string>>;
}

const WorkspaceContext = createContext<(WorkspaceState & WorkspaceActions) | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [projectType, setProjectType] = useState('documentary');
  const [inputType, setInputType] = useState('script-storyboard');
  const [uploadData, setUploadData] = useState<UploadData | null>(null);
  const [analysisData, setAnalysisData] = useState<Record<string, unknown> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [reportDocument, setReportDocument] = useState<GeneratedDocument | null>(null);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState('');
  const [title, setTitle] = useState('Untitled');
  const [writtenBy, setWrittenBy] = useState('FilmIntern');

  const value = useMemo(
    () => ({
      projectType,
      inputType,
      uploadData,
      analysisData,
      isAnalyzing,
      analysisError,
      reportDocument,
      generatedDocuments,
      activeDocumentId,
      title,
      writtenBy,
      setProjectType,
      setInputType,
      setUploadData,
      setAnalysisData,
      setIsAnalyzing,
      setAnalysisError,
      setReportDocument,
      setGeneratedDocuments,
      setActiveDocumentId,
      setTitle,
      setWrittenBy,
    }),
    [
      projectType,
      inputType,
      uploadData,
      analysisData,
      isAnalyzing,
      analysisError,
      reportDocument,
      generatedDocuments,
      activeDocumentId,
      title,
      writtenBy,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
