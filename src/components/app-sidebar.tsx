'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  FolderOpen,
  ListVideo,
  ImagePlus,
  Download,
  Settings,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  active?: boolean;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, disabled: true },
  { label: 'Projects', icon: <FolderOpen size={20} />, active: true },
  { label: 'Shot Lists', icon: <ListVideo size={20} />, disabled: true },
  { label: 'Image Prompts', icon: <ImagePlus size={20} />, disabled: true },
  { label: 'Exports', icon: <Download size={20} />, disabled: true },
];

const settingsItem: NavItem = {
  label: 'Settings',
  icon: <Settings size={20} />,
  href: '/settings',
};

function NavButton({ item }: { item: NavItem }) {
  const baseClasses =
    'flex items-center gap-3 h-10 px-3 rounded-md w-full text-left transition-colors';

  if (item.disabled) {
    return (
      <Tooltip>
        <TooltipTrigger
          className={`${baseClasses} text-stone-400 opacity-50 cursor-default`}
          disabled
        >
          {item.icon}
          <span className="hidden xl:inline text-[13px]">{item.label}</span>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Coming in a future update</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (item.href) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={<Link href={item.href} />}
          className={`${baseClasses} text-stone-400 hover:bg-white/10 hover:text-stone-50`}
        >
          {item.icon}
          <span className="hidden xl:inline text-[13px]">{item.label}</span>
        </TooltipTrigger>
        <TooltipContent side="right" className="xl:hidden">
          <p>{item.label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (item.active) {
    return (
      <Tooltip>
        <TooltipTrigger
          className={`${baseClasses} text-stone-50 bg-white/5 border-l-[3px] border-l-amber-600`}
        >
          {item.icon}
          <span className="hidden xl:inline text-[13px]">{item.label}</span>
        </TooltipTrigger>
        <TooltipContent side="right" className="xl:hidden">
          <p>{item.label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        className={`${baseClasses} text-stone-400 hover:bg-white/10 hover:text-stone-50`}
      >
        {item.icon}
        <span className="hidden xl:inline text-[13px]">{item.label}</span>
      </TooltipTrigger>
      <TooltipContent side="right" className="xl:hidden">
        <p>{item.label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden lg:flex lg:w-16 xl:w-60 flex-col bg-stone-900 shrink-0">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-stone-800">
        <h1 className="text-[28px] font-semibold text-stone-50 leading-[1.2] hidden xl:block">
          Nano Banana
        </h1>
        <span className="text-stone-50 text-[28px] font-semibold xl:hidden block text-center">
          NB
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <NavButton item={item} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Settings pinned to bottom */}
      <div className="p-2 mt-auto">
        <NavButton item={settingsItem} />
      </div>
    </aside>
  );
}
