'use client';

import { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

const CAT_META: Record<string, { image: string; accent: string }> = {
  'Терапия':     { image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&h=400&fit=crop&q=85', accent: 'from-blue-900/70' },
  'Хирургия':    { image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&h=400&fit=crop&q=85', accent: 'from-red-900/70' },
  'Гигиена':     { image: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=600&h=400&fit=crop&q=85', accent: 'from-teal-900/70' },
  'Ортодонтия':  { image: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=600&h=400&fit=crop&q=85', accent: 'from-purple-900/70' },
  'Имплантация': { image: 'https://images.unsplash.com/photo-1629909615184-74f495363b67?w=600&h=400&fit=crop&q=85', accent: 'from-zinc-900/70' },
  'Эстетика':    { image: 'https://images.unsplash.com/photo-1606265752439-1f18756aa5fc?w=600&h=400&fit=crop&q=85', accent: 'from-pink-900/70' },
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
  const [openCat, setOpenCat] = useState<string | null>(sp.get('cat') || null);

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

  /* ══ Список услуг выбранной категории ══ */
  if (openCat && grouped[openCat]) {
    const items = grouped[openCat];
    const meta = CAT_META[openCat];

    return (
      <div className="pb-8">
        {/* Hero категории */}
        <div className="relative h-[200px] md:h-[360px] md:rounded-xl md:mx-4 md:mt-4 overflow-hidden">
          {meta?.image ? (
            <img src={meta.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-brand-light" />
          )}
          <div className={`absolute inset-0 bg-gradient-to-t ${meta?.accent || 'from-black/70'} via-black/40 to-black/20`} />

          <button onClick={() => setOpenCat(null)}
            className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/15 backdrop-blur-md
              flex items-center justify-center active:scale-95 transition-transform">
            <ChevronLeft size={18} className="text-white" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-6 md:pb-10">
            <p className="text-[10px] md:text-[11px] font-bold text-white/70 tracking-[0.2em] uppercase mb-2 md:mb-3">
              Раздел услуг
            </p>
            <h1 className="text-[28px] md:text-[52px] font-extrabold text-white tracking-tight leading-[1.05]">
              {openCat}
            </h1>
            <p className="text-sm md:text-[16px] text-white/75 mt-2 md:mt-4">
              {items.length} {plural(items.length)} · Нажмите на услугу для записи
            </p>
          </div>
        </div>

        {/* Услуги — flex gap для надёжного отступа */}
        <div className="px-6 mt-6 stack-lg md:grid md:grid-cols-2 md:gap-4 md:stack-none pb-2">
          {items.map((s) => (
            <Link key={s.id as string} href={`/booking?serviceId=${s.id}`}>
              <div className="bg-bg-card rounded-lg shadow-card p-5
                active:scale-[0.98] transition-transform">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-bold leading-snug">{s.name as string}</p>
                    {s.description && (
                      <p className="text-[13px] text-ink-secondary mt-2 leading-relaxed">{s.description as string}</p>
                    )}
                    <p className="text-[12px] text-ink-tertiary mt-3 flex items-center gap-1.5">
                      <Clock size={12} /> {s.duration as number} мин
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 pt-1">
                    <p className="text-[18px] font-extrabold text-brand whitespace-nowrap">
                      {(s.price as number) === 0
                        ? 'бесплатно'
                        : <>{(s.price as number).toLocaleString('ru')}&nbsp;<span className="text-[14px] text-brand-dark">₽</span></>
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1 mt-4 pt-4 border-t border-line text-sm text-brand font-bold">
                  Записаться <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  /* ══ Разделы — модные bento-карточки ══ */
  return (
    <div className="px-6 pt-12 pb-8">
      <h1 className="text-h2">Цены</h1>
      <p className="text-[15px] text-ink-secondary mt-2 mb-8">Выберите раздел для записи</p>

      <div className="stack-md md:grid md:grid-cols-3 md:gap-4 md:stack-none">
        {Object.keys(grouped).map((cat) => {
          const count = grouped[cat].length;
          const meta = CAT_META[cat];
          return (
            <button key={cat} onClick={() => setOpenCat(cat)} className="w-full text-left">
              <div className="relative h-[140px] rounded-lg overflow-hidden shadow-card
                active:scale-[0.98] transition-transform">
                {meta?.image ? (
                  <img src={meta.image} alt={cat} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-brand-light" />
                )}
                {/* Двойной градиент для читаемости */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20" />

                <div className="relative h-full flex flex-col justify-center px-6">
                  <p className="text-[10px] font-bold text-white/60 tracking-[0.2em] uppercase mb-2">
                    Раздел
                  </p>
                  <h3 className="text-[22px] font-extrabold text-white tracking-tight">{cat}</h3>
                  <p className="text-[13px] text-white/70 mt-1.5 flex items-center gap-1">
                    {count} {plural(count)}
                    <ArrowRight size={14} className="ml-1" />
                  </p>
                </div>
              </div>
            </button>
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
