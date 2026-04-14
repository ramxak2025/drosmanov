'use client';

import { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

const CAT_IMAGES: Record<string, string> = {
  'Терапия': 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=200&fit=crop&q=80',
  'Хирургия': 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&h=200&fit=crop&q=80',
  'Гигиена': 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=400&h=200&fit=crop&q=80',
  'Ортодонтия': 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=400&h=200&fit=crop&q=80',
  'Имплантация': 'https://images.unsplash.com/photo-1629909615184-74f495363b67?w=400&h=200&fit=crop&q=80',
  'Эстетика': 'https://images.unsplash.com/photo-1606265752439-1f18756aa5fc?w=400&h=200&fit=crop&q=80',
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

  // Если категория выбрана — показываем услуги
  if (openCat && grouped[openCat]) {
    return (
      <div className="px-6 pt-12 pb-8">
        <button onClick={() => setOpenCat(null)}
          className="flex items-center gap-2 text-sm text-ink-secondary font-medium mb-6">
          <ChevronLeft size={18} /> Все разделы
        </button>

        <h1 className="text-h2">{openCat}</h1>
        <p className="text-[15px] text-ink-secondary mt-2 mb-6">
          {grouped[openCat].length} {plural(grouped[openCat].length)} — нажмите для записи
        </p>

        <div className="space-y-3">
          {grouped[openCat].map((s) => (
            <Link key={s.id as string} href={`/client/booking?serviceId=${s.id}`}>
              <div className="bg-bg-card rounded-lg shadow-card p-5
                active:scale-[0.98] transition-transform">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[15px] font-bold">{s.name as string}</p>
                    {s.description && (
                      <p className="text-sm text-ink-secondary mt-2 leading-relaxed">{s.description as string}</p>
                    )}
                    <p className="text-sm text-ink-tertiary mt-2 flex items-center gap-1">
                      <Clock size={13} /> {s.duration as number} мин
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                    <span className="text-[17px] font-extrabold text-brand">
                      {(s.price as number) === 0 ? 'бесплатно' : `${(s.price as number).toLocaleString('ru')}\u00A0\u20BD`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1 mt-3 text-sm text-brand font-semibold">
                  Записаться <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Категории с фотками
  return (
    <div className="px-6 pt-12 pb-8">
      <h1 className="text-h2">Цены</h1>
      <p className="text-[15px] text-ink-secondary mt-2 mb-8">Выберите раздел для записи</p>

      <div className="space-y-4">
        {Object.keys(grouped).map((cat) => {
          const count = grouped[cat].length;
          const img = CAT_IMAGES[cat];
          return (
            <button key={cat} onClick={() => setOpenCat(cat)} className="w-full text-left">
              <div className="bg-bg-card rounded-lg shadow-card overflow-hidden
                active:scale-[0.98] transition-transform">
                {/* Фото раздела */}
                <div className="h-32 relative">
                  {img ? (
                    <img src={img} alt={cat} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-brand-light" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-[17px] font-bold text-white">{cat}</h3>
                    <p className="text-[13px] text-white/70 mt-0.5">{count} {plural(count)}</p>
                  </div>
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
