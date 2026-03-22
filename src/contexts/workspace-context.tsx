'use client';

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from 'react';
import type { ParseResult } from '@/lib/parsers/txt-parser';
import type { GeneratedDocument } from '@/lib/documents/types';

export interface UploadData {
  text: string;
  metadata: ParseResult['metadata'];
  fdxSource?: string;
}

export interface ProjectListItem {
  id: string;
  title: string;
  projectType: string;
  fileName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceState {
  currentProjectId: string | null;
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
  isNewProjectMode: boolean;
  criticAnalysis: string | null;
  isCriticAnalyzing: boolean;
}

interface WorkspaceActions {
  setCurrentProjectId: Dispatch<SetStateAction<string | null>>;
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
  setIsNewProjectMode: Dispatch<SetStateAction<boolean>>;
  setCriticAnalysis: Dispatch<SetStateAction<string | null>>;
  setIsCriticAnalyzing: Dispatch<SetStateAction<boolean>>;
  resetWorkspace: () => void;
  loadProject: (id: string) => Promise<void>;
  saveAnalysis: (projectId: string, data: {
    uploadData: UploadData;
    analysisData: Record<string, unknown>;
    reportDocument: GeneratedDocument;
  }) => Promise<void>;
  saveGeneratedDocuments: (projectId: string, docs: GeneratedDocument[]) => Promise<void>;
}

const WorkspaceContext = createContext<(WorkspaceState & WorkspaceActions) | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectType, setProjectType] = useState('documentary');
  const [inputType, setInputType] = useState('script-storyboard');
  const [uploadData, setUploadData] = useState<UploadData | null>(null);
  const [analysisData, setAnalysisData] = useState<Record<string, unknown> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [reportDocument, setReportDocument] = useState<GeneratedDocument | null>(null);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState('');
  const [title, setTitle] = useState('');
  const [writtenBy, setWrittenBy] = useState('FilmIntern');
  const [isNewProjectMode, setIsNewProjectMode] = useState(false);
  const [criticAnalysis, setCriticAnalysis] = useState<string | null>(null);
  const [isCriticAnalyzing, setIsCriticAnalyzing] = useState(false);

  const resetWorkspace = useCallback(() => {
    setCurrentProjectId(null);
    setUploadData(null);
    setAnalysisData(null);
    setIsAnalyzing(false);
    setAnalysisError(null);
    setReportDocument(null);
    setGeneratedDocuments([]);
    setActiveDocumentId('');
    setTitle('');
    setIsNewProjectMode(false);
    setCriticAnalysis(null);
    setIsCriticAnalyzing(false);
  }, []);

  const loadProject = useCallback(async (id: string) => {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) return;
    const project = await res.json();

    setCurrentProjectId(project.id);
    setProjectType(project.projectType);
    setTitle(project.title);
    setUploadData(project.uploadData ? JSON.parse(project.uploadData) : null);
    setAnalysisData(project.analysisData ? JSON.parse(project.analysisData) : null);
    setReportDocument(project.reportDocument ? JSON.parse(project.reportDocument) : null);
    const docs: GeneratedDocument[] = project.generatedDocuments ? JSON.parse(project.generatedDocuments) : [];
    setGeneratedDocuments(docs);
    setActiveDocumentId(project.reportDocument ? JSON.parse(project.reportDocument).id : docs[0]?.id ?? '');
    setAnalysisError(null);
    setIsAnalyzing(false);
    setIsNewProjectMode(false);
    setCriticAnalysis(project.criticAnalysis ?? null);
    setIsCriticAnalyzing(false);
  }, []);

  const saveAnalysis = useCallback(async (
    projectId: string,
    data: { uploadData: UploadData; analysisData: Record<string, unknown>; reportDocument: GeneratedDocument }
  ) => {
    await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }, []);

  const saveGeneratedDocuments = useCallback(async (projectId: string, docs: GeneratedDocument[]) => {
    await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generatedDocuments: docs }),
    });
  }, []);

  const value = useMemo(
    () => ({
      currentProjectId,
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
      isNewProjectMode,
      criticAnalysis,
      isCriticAnalyzing,
      setCurrentProjectId,
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
      setIsNewProjectMode,
      setCriticAnalysis,
      setIsCriticAnalyzing,
      resetWorkspace,
      loadProject,
      saveAnalysis,
      saveGeneratedDocuments,
    }),
    [
      currentProjectId,
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
      isNewProjectMode,
      criticAnalysis,
      isCriticAnalyzing,
      resetWorkspace,
      loadProject,
      saveAnalysis,
      saveGeneratedDocuments,
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
