'use client';

import { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

const CAT_ICONS: Record<string, string> = {
  'Терапия': '🦷', 'Хирургия': '⚕️', 'Гигиена': '✨',
  'Ортодонтия': '😁', 'Имплантация': '🔩', 'Эстетика': '💎',
};

export default function PricePage() {
  return (
    <Suspense fallback={<div className="px-6 pt-12"><h1 className="text-h2">Цены</h1></div>}>
      <Content />
    </Suspense>
  );
}

function Content() {
  const sp = useSearchParams();
  const initialCat = sp.get('cat') || null;
  const [openCat, setOpenCat] = useState<string | null>(initialCat);

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => { const { data } = await api.get('/services'); return data.data; },
  });

  const grouped: Record<string, Record<string, unknown>[]> = {};
  (services || []).forEach((s: Record<string, unknown>) => {
    const cat = s.category as string;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  });

  const cats = Object.keys(grouped);

  const toggle = (cat: string) => {
    setOpenCat(openCat === cat ? null : cat);
  };

  return (
    <div className="px-6 pt-12 pb-8">
      <h1 className="text-h2">Цены</h1>
      <p className="text-[15px] text-ink-secondary mt-2 mb-8">Выберите раздел для записи</p>

      {/* Bento grid */}
      <div className="space-y-3">
        {cats.map((cat, i) => {
          const items = grouped[cat];
          const isOpen = openCat === cat;
          const icon = CAT_ICONS[cat] || '📋';

          return (
            <div key={cat}>
              {/* Category card */}
              <button
                onClick={() => toggle(cat)}
                className="w-full bg-bg-card rounded-lg shadow-card p-5 flex items-center gap-4
                  active:scale-[0.99] transition-transform text-left"
              >
                <div className="w-12 h-12 rounded-md bg-brand-subtle flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">{icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-bold">{cat}</p>
                  <p className="text-sm text-ink-tertiary mt-0.5">{items.length} {plural(items.length)}</p>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-ink-tertiary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Services list — expandable */}
              {isOpen && (
                <div className="mt-2 space-y-2 pl-1 pr-1">
                  {items.map((s) => (
                    <Link key={s.id as string} href={`/client/booking?serviceId=${s.id}`}>
                      <div className="bg-bg-card rounded-md shadow-soft px-5 py-4 flex items-center gap-4
                        active:scale-[0.98] transition-transform">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{s.name as string}</p>
                          {s.description && (
                            <p className="text-[12px] text-ink-tertiary mt-1 line-clamp-1">{s.description as string}</p>
                          )}
                          <p className="text-[12px] text-ink-disabled mt-1 flex items-center gap-1">
                            <Clock size={11} /> {s.duration as number} мин
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[15px] font-extrabold text-brand">
                            {(s.price as number) === 0 ? 'бесплатно' : `${(s.price as number).toLocaleString('ru')}\u00A0\u20BD`}
                          </span>
                          <ArrowRight size={14} className="text-brand" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function plural(n: number): string {
  const a = Math.abs(n) % 100, l = a % 10;
  if (a > 10 && a < 20) return 'услуг';
  if (l > 1 && l < 5) return 'услуги';
  return l === 1 ? 'услуга' : 'услуг';
}
