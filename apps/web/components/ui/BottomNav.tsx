'use client';

import { motion } from 'framer-motion';
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bottom-nav">
      <div className="max-w-[430px] mx-auto flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link key={tab.href} href={tab.href} className="flex-1">
              <motion.div
                className="flex flex-col items-center justify-center gap-0.5 py-2 relative"
                animate={{ scale: isActive ? 1.05 : 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <motion.div
                  animate={{ color: isActive ? '#C9A96E' : '#7A6A5A' }}
                  transition={{ duration: 0.15 }}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 1.8} />
                </motion.div>
                <motion.span
                  className="text-[10px] font-medium leading-none"
                  animate={{
                    color: isActive ? '#C9A96E' : '#7A6A5A',
                    fontWeight: isActive ? 600 : 400,
                  }}
                  transition={{ duration: 0.15 }}
                >
                  {tab.label}
                </motion.span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
