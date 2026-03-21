'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { applyAccentColor, getStoredAccent } from '@/lib/theme';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Shot Lists', href: '/shot-lists' },
  { label: 'Image Prompts', href: '/image-prompts' },
  { label: 'Exports', href: '/exports' },
];

export function AppTopNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted) {
      applyAccentColor(getStoredAccent(), theme === 'dark' ? 'dark' : 'light');
    }
  }, [theme, mounted]);

  return (
    <header className="h-14 bg-background border-b border-border flex items-center px-6 shrink-0">
      <span className="text-base font-semibold text-foreground mr-10 tracking-tight shrink-0">
        Film Intern
      </span>

      <nav className="flex items-center flex-1 h-full">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? 'flex items-center h-full px-4 text-sm font-medium text-primary border-b-2 border-primary'
                  : 'flex items-center h-full px-4 text-sm text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent'
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {!mounted ? (
        <div className="w-[34px] h-[34px]" />
      ) : (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      )}

      <Link
        href="/settings"
        className={`p-2 rounded-md transition-colors ${
          pathname === '/settings'
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label="Settings"
      >
        <Settings size={18} />
      </Link>
    </header>
  );
}
