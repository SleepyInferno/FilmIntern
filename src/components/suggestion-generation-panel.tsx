'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export type AnalysisType = 'standard' | 'critic';

interface SuggestionGenerationPanelProps {
  hasSuggestions: boolean;
  isGenerating: boolean;
  hasCriticAnalysis: boolean;
  onGenerate: (count: number, analysisType: AnalysisType) => void;
  onRegenerate: (count: number, analysisType: AnalysisType) => void;
}

export function SuggestionGenerationPanel({
  hasSuggestions,
  isGenerating,
  hasCriticAnalysis,
  onGenerate,
  onRegenerate,
}: SuggestionGenerationPanelProps) {
  const [count, setCount] = useState(10);
  const [analysisType, setAnalysisType] = useState<AnalysisType>('standard');

  return (
    <Card role="region" aria-label="Suggestion generation">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle className="text-base font-semibold leading-snug">
            Generate Suggestions
          </CardTitle>
          <CardDescription>
            AI rewrites targeting weaknesses from your analysis
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="suggestion-count" className="text-sm font-semibold whitespace-nowrap">
            Number of suggestions
          </label>
          <Input
            id="suggestion-count"
            type="number"
            min={1}
            max={25}
            value={count}
            onChange={(e) => setCount(Math.min(25, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-18"
            disabled={isGenerating}
          />
        </div>
      </CardHeader>

      {hasCriticAnalysis && (
        <CardContent className="pt-0 pb-2">
          <div className="flex items-center gap-1 p-1 rounded-md bg-muted w-fit">
            <button
              type="button"
              onClick={() => setAnalysisType('standard')}
              disabled={isGenerating}
              className={`px-3 py-1.5 text-sm rounded-sm transition-colors font-medium ${
                analysisType === 'standard'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Standard Analysis
            </button>
            <button
              type="button"
              onClick={() => setAnalysisType('critic')}
              disabled={isGenerating}
              className={`px-3 py-1.5 text-sm rounded-sm transition-colors font-medium ${
                analysisType === 'critic'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Harsh Critic
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {analysisType === 'critic'
              ? 'Generates rewrites that directly address the professional critique — sharper, more demanding notes'
              : 'Generates rewrites targeting specific weaknesses from the standard analysis'}
          </p>
        </CardContent>
      )}

      <CardFooter className="flex justify-between">
        <Button
          size="lg"
          onClick={() => hasSuggestions ? undefined : onGenerate(count, analysisType)}
          disabled={isGenerating || hasSuggestions}
          className={hasSuggestions ? 'hidden' : ''}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating suggestions...
            </>
          ) : (
            'Generate Suggestions'
          )}
        </Button>

        {hasSuggestions && !isGenerating && (
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="outline" />}>
              Regenerate Suggestions
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Regenerate all suggestions?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will replace your current suggestions. Any review progress from a previous session will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Current Suggestions</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onRegenerate(count, analysisType)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Replace Suggestions
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {isGenerating && hasSuggestions && (
          <Button size="lg" disabled>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating suggestions...
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
