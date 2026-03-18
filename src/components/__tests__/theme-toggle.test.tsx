import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock next-themes
const mockSetTheme = vi.fn();
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: mockSetTheme }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Mock @/lib/theme
vi.mock('@/lib/theme', () => ({
  applyAccentColor: vi.fn(),
  getStoredAccent: () => 'amber',
}));

import { AppTopNav } from '../app-topnav';

describe('Theme toggle in AppTopNav', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
  });

  it('renders a toggle button with aria-label containing "Switch to"', () => {
    render(<AppTopNav />);
    const toggleBtn = screen.getByRole('button', { name: /switch to/i });
    expect(toggleBtn).toBeDefined();
  });

  it('calls setTheme when toggle is clicked', () => {
    render(<AppTopNav />);
    const toggleBtn = screen.getByRole('button', { name: /switch to/i });
    fireEvent.click(toggleBtn);
    expect(mockSetTheme).toHaveBeenCalledOnce();
  });
});
