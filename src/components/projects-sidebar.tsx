'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, Trash2, Film, Video, Briefcase, Tv, FolderOpen, Loader2 } from 'lucide-react';
import { useWorkspace, type ProjectListItem } from '@/contexts/workspace-context';
import { cn } from '@/lib/utils';
import { ProjectTypeFilter, ALL_TYPES } from '@/components/project-type-filter';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  narrative: <Film size={13} />,
  documentary: <Video size={13} />,
  corporate: <Briefcase size={13} />,
  'tv-episodic': <Tv size={13} />,
};

const TYPE_LABELS: Record<string, string> = {
  narrative: 'Narrative',
  documentary: 'Documentary',
  corporate: 'Corporate',
  'tv-episodic': 'TV / Episodic',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ProjectsSidebar() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const {
    currentProjectId, loadProject, resetWorkspace, setIsNewProjectMode,
    isNewProjectMode, analysisData, reportDocument, title, projectType, uploadData,
  } = useWorkspace();
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(ALL_TYPES));
  const router = useRouter();
  const pathname = usePathname();
  const prevProjectIdRef = useRef<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) setProjects(await res.json());
    } catch {
      // ignore fetch errors
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Re-fetch only when a project is created or loaded (not when workspace resets to null)
  useEffect(() => {
    if (currentProjectId && currentProjectId !== prevProjectIdRef.current) {
      fetchProjects();
    }
    prevProjectIdRef.current = currentProjectId;
  }, [currentProjectId, fetchProjects]);

  async function handleSelect(id: string) {
    await loadProject(id);
    if (pathname !== '/') router.push('/');
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setDeleting(id);
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (currentProjectId === id) resetWorkspace();
    setDeleting(null);
  }

  async function handleNew() {
    // Defensive: if somehow there's unsaved analysis data (no project ID), save a stub first
    if (!currentProjectId && (uploadData || analysisData)) {
      try {
        const fileName = (uploadData?.metadata as { filename?: string })?.filename ?? '';
        const projectTitle = title.trim() || (fileName ? fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'New Project');
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: projectTitle, projectType, fileName: fileName || null }),
        });
        if (res.ok && analysisData && reportDocument) {
          const project = await res.json();
          await fetch(`/api/projects/${project.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysisData, reportDocument }),
          });
        }
        await fetchProjects();
      } catch {
        // non-blocking
      }
    }

    resetWorkspace();
    setIsNewProjectMode(true);
    if (pathname !== '/') router.push('/');
  }

  function handleToggleAll() {
    setActiveTypes(new Set(ALL_TYPES));
  }

  function handleToggleType(type: string) {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      // Prevent empty filter -- reset to all if nothing selected
      if (next.size === 0) return new Set(ALL_TYPES);
      return next;
    });
  }

  const filteredProjects = useMemo(
    () => activeTypes.size === ALL_TYPES.length
      ? projects
      : projects.filter(p => activeTypes.has(p.projectType)),
    [projects, activeTypes]
  );

  const hasProjects = projects.length > 0;
  const hasFilteredProjects = filteredProjects.length > 0;

  return (
    <aside className="w-56 shrink-0 border-r border-border flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projects</span>
        <button
          onClick={handleNew}
          disabled={isNewProjectMode}
          className={cn(
            'p-1 rounded transition-colors',
            isNewProjectMode
              ? 'opacity-30 cursor-not-allowed text-muted-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
          title={isNewProjectMode ? 'Finish or cancel the current project first' : 'New project'}
        >
          <Plus size={15} />
        </button>
      </div>

      <ProjectTypeFilter
        activeTypes={activeTypes}
        onToggleType={handleToggleType}
        onToggleAll={handleToggleAll}
      />

      <div className="flex-1 overflow-y-auto py-1">
        {/* Pending new project indicator */}
        {isNewProjectMode && (
          <div className="px-3 py-2.5 flex items-center gap-2 bg-accent border-l-2 border-foreground/20">
            <Loader2 size={12} className="text-muted-foreground animate-spin" />
            <span className="text-sm text-muted-foreground italic truncate">New project…</span>
          </div>
        )}

        {!hasProjects && !isNewProjectMode ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
            <FolderOpen size={28} className="text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No projects yet.<br />Click <strong>+</strong> to get started.</p>
          </div>
        ) : hasProjects && !hasFilteredProjects && !isNewProjectMode ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
            <FolderOpen size={28} className="text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No matching projects.</p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelect(project.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(project.id); }}
              className={cn(
                'group w-full text-left px-3 py-2.5 flex flex-col gap-0.5 hover:bg-accent transition-colors relative cursor-pointer',
                currentProjectId === project.id && !isNewProjectMode && 'bg-accent'
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={cn(
                  'text-sm truncate flex-1 font-medium',
                  currentProjectId === project.id && !isNewProjectMode ? 'text-foreground' : 'text-foreground/80'
                )}>
                  {project.title}
                </span>
                <button
                  onClick={(e) => handleDelete(e, project.id)}
                  disabled={deleting === project.id}
                  className="shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  title="Delete project"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {TYPE_ICONS[project.projectType] ?? <Film size={13} />}
                  {TYPE_LABELS[project.projectType] ?? project.projectType}
                </span>
                <span>·</span>
                <span>{timeAgo(project.updatedAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
