import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SettingsPage from '../page';

const mockSettings = {
  provider: 'anthropic' as const,
  anthropic: { model: 'claude-sonnet-4-5' },
  openai: { model: 'gpt-4o' },
  ollama: { model: 'llama3.1', baseURL: 'http://localhost:11434/api' },
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSettings),
    })
  );
});

describe('SettingsPage', () => {
  it('renders provider selector after loading', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('AI Provider')).toBeDefined();
    });

    // Select element should have 'anthropic' as its value
    const select = screen.getByRole('combobox');
    expect((select as HTMLSelectElement).value).toBe('anthropic');
    expect(screen.getByText('Anthropic Claude')).toBeDefined();
    expect(screen.getAllByText('OpenAI').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Ollama/).length).toBeGreaterThanOrEqual(1);
  });

  it('fetches settings on mount', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/settings');
    });
  });

  it('saves settings on button click', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Save Settings')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Save Settings'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockSettings),
      });
    });
  });

  it('shows saved confirmation after successful save', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Save Settings')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Save Settings'));

    await waitFor(() => {
      expect(screen.getByText('Settings saved')).toBeDefined();
    });
  });

  it('shows loading state initially', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });
});
