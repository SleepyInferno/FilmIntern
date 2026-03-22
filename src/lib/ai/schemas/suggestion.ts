import { z } from 'zod';

export const suggestionSchema = z.object({
  sceneHeading: z.string().nullable().describe('Scene heading where the weakness occurs, or null if not scene-specific'),
  characterName: z.string().nullable().describe('Character name if the suggestion relates to a specific character'),
  originalText: z.string().describe('Exact original text span from the script that should be rewritten'),
  rewriteText: z.string().describe('The proposed rewrite replacing the original text'),
});

export type SuggestionOutput = z.infer<typeof suggestionSchema>;
