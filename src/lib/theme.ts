export const ACCENT_PRESETS = {
  amber: {
    dark:  { primary: 'oklch(0.769 0.188 70.08)',  primaryFg: 'oklch(0.145 0 0)' },
    light: { primary: 'oklch(0.666 0.179 58.318)', primaryFg: 'oklch(1 0 0)' },
  },
  blue: {
    dark:  { primary: 'oklch(0.7 0.15 250)',   primaryFg: 'oklch(0.145 0 0)' },
    light: { primary: 'oklch(0.55 0.18 250)',  primaryFg: 'oklch(1 0 0)' },
  },
  emerald: {
    dark:  { primary: 'oklch(0.72 0.17 160)',  primaryFg: 'oklch(0.145 0 0)' },
    light: { primary: 'oklch(0.6 0.18 160)',   primaryFg: 'oklch(1 0 0)' },
  },
  purple: {
    dark:  { primary: 'oklch(0.7 0.15 300)',   primaryFg: 'oklch(0.145 0 0)' },
    light: { primary: 'oklch(0.55 0.17 300)',  primaryFg: 'oklch(1 0 0)' },
  },
} as const;

export type AccentColor = keyof typeof ACCENT_PRESETS;

export function applyAccentColor(accent: AccentColor, theme: 'dark' | 'light') {
  const preset = ACCENT_PRESETS[accent][theme];
  document.documentElement.style.setProperty('--primary', preset.primary);
  document.documentElement.style.setProperty('--primary-foreground', preset.primaryFg);
  document.documentElement.style.setProperty('--ring', preset.primary);
}

export function getStoredAccent(): AccentColor {
  if (typeof window === 'undefined') return 'amber';
  return (localStorage.getItem('accent-color') as AccentColor) || 'amber';
}

export function setStoredAccent(accent: AccentColor) {
  localStorage.setItem('accent-color', accent);
}

/**
 * Inline script to prevent accent color flash on page load.
 * Reads accent-color from localStorage and applies CSS variables before paint.
 * Must be injected into <head> via dangerouslySetInnerHTML.
 */
export const ACCENT_FLASH_SCRIPT = `(function(){try{var a=localStorage.getItem('accent-color')||'amber';var d=document.documentElement.classList.contains('dark');var p={amber:{dark:{p:'oklch(0.769 0.188 70.08)',f:'oklch(0.145 0 0)'},light:{p:'oklch(0.666 0.179 58.318)',f:'oklch(1 0 0)'}},blue:{dark:{p:'oklch(0.7 0.15 250)',f:'oklch(0.145 0 0)'},light:{p:'oklch(0.55 0.18 250)',f:'oklch(1 0 0)'}},emerald:{dark:{p:'oklch(0.72 0.17 160)',f:'oklch(0.145 0 0)'},light:{p:'oklch(0.6 0.18 160)',f:'oklch(1 0 0)'}},purple:{dark:{p:'oklch(0.7 0.15 300)',f:'oklch(0.145 0 0)'},light:{p:'oklch(0.55 0.17 300)',f:'oklch(1 0 0)'}}};var t=d?'dark':'light';var v=p[a]&&p[a][t]?p[a][t]:p.amber[t];var s=document.documentElement.style;s.setProperty('--primary',v.p);s.setProperty('--primary-foreground',v.f);s.setProperty('--ring',v.p);}catch(e){}})();`;
