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
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(12px,env(safe-area-inset-bottom))]">
      <div className="max-w-[430px] mx-auto">
        <div className="bg-white/85 backdrop-blur-2xl rounded-[22px] shadow-[0_2px_30px_rgba(0,0,0,0.08)] border border-white/60 flex items-center justify-around h-[60px] px-1">
          {tabs.map((tab) => {
            const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
            const Icon = tab.icon;

            return (
              <Link key={tab.href} href={tab.href} className="flex-1">
                <motion.div
                  className="flex flex-col items-center justify-center gap-[3px] py-1.5 relative"
                  animate={{ scale: isActive ? 1.08 : 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <motion.div
                    animate={{ color: isActive ? '#C9A96E' : '#9E9189' }}
                    transition={{ duration: 0.15 }}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
                  </motion.div>
                  <motion.span
                    className="text-[10px] leading-none"
                    animate={{
                      color: isActive ? '#C9A96E' : '#9E9189',
                      fontWeight: isActive ? 600 : 400,
                    }}
                    transition={{ duration: 0.15 }}
                  >
                    {tab.label}
                  </motion.span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
