'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

interface Tab { href: string; label: string; icon: LucideIcon; }

export function BottomNav({ tabs }: { tabs: Tab[] }) {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-[max(10px,env(safe-area-inset-bottom))]">
      <div className="max-w-page mx-auto">
        <div className="bg-bg-elevated/92 backdrop-blur-2xl rounded-xl shadow-nav
          flex items-center justify-around h-[60px]">
          {tabs.map((tab) => {
            const active = tab.href === '/' ? path === '/' : path.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link key={tab.href} href={tab.href}
                className="flex-1 flex flex-col items-center justify-center gap-[5px]">
                <Icon size={21} strokeWidth={active ? 2 : 1.4}
                  className={active ? 'text-brand' : 'text-ink-disabled'} />
                <span className={`text-[10px] font-semibold tracking-wide
                  ${active ? 'text-brand' : 'text-ink-disabled'}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
