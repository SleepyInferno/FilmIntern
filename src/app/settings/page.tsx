'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

interface AISettings {
  provider: 'anthropic' | 'openai' | 'ollama';
  anthropic: { model: string; apiKey: string };
  openai: { model: string; apiKey: string };
  ollama: { model: string; baseURL: string };
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const inputClasses =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data: AISettings) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold mb-6">Settings</h1>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold mb-6">Settings</h1>
        <p className="text-sm text-destructive">
          Failed to load settings. Make sure the settings API is available.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="text-sm font-medium block mb-2">
              AI Provider
            </label>
            <select
              value={settings.provider}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  provider: e.target.value as AISettings['provider'],
                })
              }
              className={inputClasses}
            >
              <option value="anthropic">Anthropic Claude</option>
              <option value="openai">OpenAI</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
          </div>

          <Separator />

          {/* Anthropic Config */}
          <div>
            <h3 className="text-sm font-medium mb-2">Anthropic</h3>
            <label className="text-xs text-muted-foreground block mb-1">
              API Key
            </label>
            <input
              type="password"
              value={settings.anthropic.apiKey}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  anthropic: { ...settings.anthropic, apiKey: e.target.value },
                })
              }
              className={inputClasses}
              placeholder="sk-ant-..."
            />
            <label className="text-xs text-muted-foreground block mb-1 mt-3">
              Model
            </label>
            <select
              value={settings.anthropic.model}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  anthropic: { ...settings.anthropic, model: e.target.value },
                })
              }
              className={inputClasses}
            >
              <optgroup label="Claude 4">
                <option value="claude-opus-4-6">claude-opus-4-6</option>
                <option value="claude-sonnet-4-6">claude-sonnet-4-6</option>
                <option value="claude-haiku-4-5">claude-haiku-4-5</option>
              </optgroup>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Falls back to ANTHROPIC_API_KEY environment variable if left blank.
            </p>
          </div>

          {/* OpenAI Config */}
          <div>
            <h3 className="text-sm font-medium mb-2">OpenAI</h3>
            <label className="text-xs text-muted-foreground block mb-1">
              API Key
            </label>
            <input
              type="password"
              value={settings.openai.apiKey}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  openai: { ...settings.openai, apiKey: e.target.value },
                })
              }
              className={inputClasses}
              placeholder="sk-..."
            />
            <label className="text-xs text-muted-foreground block mb-1 mt-3">
              Model
            </label>
            <select
              value={settings.openai.model}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  openai: { ...settings.openai, model: e.target.value },
                })
              }
              className={inputClasses}
            >
              <optgroup label="GPT-5.4">
                <option value="gpt-5.4">gpt-5.4</option>
                <option value="gpt-5.4-mini">gpt-5.4-mini</option>
                <option value="gpt-5.4-nano">gpt-5.4-nano</option>
                <option value="gpt-5.4-pro">gpt-5.4-pro</option>
              </optgroup>
              <optgroup label="GPT-5.3">
                <option value="gpt-5.3-chat-latest">gpt-5.3-chat-latest</option>
              </optgroup>
              <optgroup label="GPT-5.2">
                <option value="gpt-5.2">gpt-5.2</option>
                <option value="gpt-5.2-pro">gpt-5.2-pro</option>
              </optgroup>
              <optgroup label="GPT-5.1">
                <option value="gpt-5.1">gpt-5.1</option>
                <option value="gpt-5.1-codex-max">gpt-5.1-codex-max</option>
                <option value="gpt-5.1-codex">gpt-5.1-codex</option>
                <option value="gpt-5.1-codex-mini">gpt-5.1-codex-mini</option>
              </optgroup>
              <optgroup label="GPT-5">
                <option value="gpt-5">gpt-5</option>
                <option value="gpt-5-pro">gpt-5-pro</option>
                <option value="gpt-5-mini">gpt-5-mini</option>
                <option value="gpt-5-nano">gpt-5-nano</option>
              </optgroup>
              <optgroup label="GPT-4.1">
                <option value="gpt-4.1">gpt-4.1</option>
                <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                <option value="gpt-4.1-nano">gpt-4.1-nano</option>
              </optgroup>
              <optgroup label="GPT-4o">
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-4o-mini">gpt-4o-mini</option>
              </optgroup>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Falls back to OPENAI_API_KEY environment variable if left blank.
            </p>
          </div>

          {/* Ollama Config */}
          <div>
            <h3 className="text-sm font-medium mb-2">Ollama (Local)</h3>
            <label className="text-xs text-muted-foreground block mb-1">
              Model
            </label>
            <input
              type="text"
              value={settings.ollama.model}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  ollama: { ...settings.ollama, model: e.target.value },
                })
              }
              className={inputClasses}
              placeholder="llama3.1"
            />
            <label className="text-xs text-muted-foreground block mb-1 mt-3">
              Base URL
            </label>
            <input
              type="text"
              value={settings.ollama.baseURL}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  ollama: { ...settings.ollama, baseURL: e.target.value },
                })
              }
              className={inputClasses}
              placeholder="http://localhost:11434/api"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ollama must be running locally. No API key needed.
            </p>
          </div>

          <Separator />

          {/* Save Button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}
            </Button>
            {saveStatus === 'saved' && (
              <span className="text-sm text-green-600">Settings saved</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-sm text-red-600">Failed to save</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
