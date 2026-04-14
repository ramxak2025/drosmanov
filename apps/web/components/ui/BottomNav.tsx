'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function BottomNav({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(8px,env(safe-area-inset-bottom))]">
      <div className="max-w-container mx-auto">
        {/* 8pt: h=64, rounded=16, shadow=elevated */}
        <div className="bg-neutral-0/90 backdrop-blur-xl rounded-lg shadow-elevated border border-neutral-200/40
          flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
            const Icon = tab.icon;

            return (
              <Link key={tab.href} href={tab.href} className="flex-1 flex flex-col items-center justify-center gap-1 py-2">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.5}
                  className={isActive ? 'text-primary' : 'text-neutral-400'}
                />
                <span className={`text-caption font-medium ${isActive ? 'text-primary' : 'text-neutral-400'}`}>
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
