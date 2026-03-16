export interface ProjectTypeConfig {
  id: string;
  label: string;
  description: string;
  icon: string;
  acceptedExtensions: string[];
  acceptedMimeTypes: string[];
  fileTypeLabel: string;
}

export const PROJECT_TYPES: Record<string, ProjectTypeConfig> = {
  documentary: {
    id: 'documentary',
    label: 'Documentary',
    description:
      'Interview mining: extract quotes, themes, and key moments from transcripts',
    icon: 'Video',
    acceptedExtensions: ['.txt'],
    acceptedMimeTypes: ['text/plain'],
    fileTypeLabel: 'transcript',
  },
  corporate: {
    id: 'corporate',
    label: 'Corporate Interview',
    description: 'Key messaging, soundbites, and corporate narrative analysis',
    icon: 'Briefcase',
    acceptedExtensions: [],
    acceptedMimeTypes: [],
    fileTypeLabel: 'script',
  },
  narrative: {
    id: 'narrative',
    label: 'Narrative Film',
    description:
      'Story structure, character arcs, and script coverage analysis',
    icon: 'Film',
    acceptedExtensions: [],
    acceptedMimeTypes: [],
    fileTypeLabel: 'script',
  },
  'tv-episodic': {
    id: 'tv-episodic',
    label: 'TV / Episodic',
    description: 'Episode arc and series structure analysis',
    icon: 'Tv',
    acceptedExtensions: [],
    acceptedMimeTypes: [],
    fileTypeLabel: 'script',
  },
  'short-form': {
    id: 'short-form',
    label: 'Short-form / Branded',
    description: 'Pacing, messaging effectiveness, and CTA clarity analysis',
    icon: 'Clapperboard',
    acceptedExtensions: [],
    acceptedMimeTypes: [],
    fileTypeLabel: 'script',
  },
};
