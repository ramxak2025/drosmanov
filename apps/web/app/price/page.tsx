'use client';

import { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

/**
 * Визуальное представление раздела — цветной градиент + крупный эмодзи/SVG.
 * Без stock-фото людей. Элегантно, единообразно, гарантированно.
 */
const CAT_META: Record<string, { gradient: string; emoji: string }> = {
  'Терапия':     { gradient: 'from-[#5E8BBA] via-[#4A7399] to-[#2C4F70]', emoji: '🦷' },
  'Хирургия':    { gradient: 'from-[#A35565] via-[#8B3F4F] to-[#5F2C37]', emoji: '⚕️' },
  'Гигиена':     { gradient: 'from-[#4FA89B] via-[#358578] to-[#1F5A50]', emoji: '✨' },
  'Ортодонтия':  { gradient: 'from-[#8C6FBD] via-[#6F54A0] to-[#483976]', emoji: '😁' },
  'Имплантация': { gradient: 'from-[#5D6872] via-[#414B54] to-[#262E36]', emoji: '🔩' },
  'Эстетика':    { gradient: 'from-[#D4A374] via-[#B08754] to-[#7A5A38]', emoji: '💎' },
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
        {/* Hero категории — градиент с эмодзи */}
        <div className={`relative h-[200px] md:h-[360px] md:rounded-xl md:mx-4 md:mt-4 overflow-hidden
          bg-gradient-to-br ${meta?.gradient || 'from-brand to-brand-dark'}`}>
          {/* Крупный декоративный эмодзи */}
          <div className="absolute top-1/2 right-8 md:right-16 -translate-y-1/2 text-[120px] md:text-[200px] opacity-20 select-none">
            {meta?.emoji || '🦷'}
          </div>
          {/* Dark overlay для читаемости текста снизу */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

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
              <div className={`relative h-[140px] rounded-lg overflow-hidden shadow-card
                bg-gradient-to-br ${meta?.gradient || 'from-brand to-brand-dark'}
                active:scale-[0.98] transition-transform`}>
                {/* Декоративный эмодзи */}
                <div className="absolute top-1/2 right-4 -translate-y-1/2 text-[72px] opacity-20 select-none">
                  {meta?.emoji || '🦷'}
                </div>
                {/* Dark overlay слева для текста */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

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
