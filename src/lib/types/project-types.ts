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
    acceptedExtensions: ['.txt', '.pdf', '.docx'],
    acceptedMimeTypes: ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    fileTypeLabel: 'transcript',
  },
  corporate: {
    id: 'corporate',
    label: 'Corporate Interview',
    description: 'Key messaging, soundbites, and corporate narrative analysis',
    icon: 'Briefcase',
    acceptedExtensions: ['.txt', '.pdf', '.docx'],
    acceptedMimeTypes: ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    fileTypeLabel: 'script',
  },
  narrative: {
    id: 'narrative',
    label: 'Narrative Film',
    description:
      'Story structure, character arcs, and script coverage analysis',
    icon: 'Film',
    acceptedExtensions: ['.pdf', '.fdx', '.docx'],
    acceptedMimeTypes: ['application/pdf', 'application/xml', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    fileTypeLabel: 'script',
  },
  'tv-episodic': {
    id: 'tv-episodic',
    label: 'TV / Episodic',
    description: 'Episode arc and series structure analysis',
    icon: 'Tv',
    acceptedExtensions: ['.pdf', '.fdx', '.docx'],
    acceptedMimeTypes: ['application/pdf', 'application/xml', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    fileTypeLabel: 'script',
  },
};
