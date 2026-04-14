'use client';

import { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function PricePage() {
  return (
    <Suspense fallback={<div className="ds-section pt-8"><h1 className="text-h2">Цены</h1></div>}>
      <PriceContent />
    </Suspense>
  );
}

function PriceContent() {
  const searchParams = useSearchParams();
  const [activeCat, setActiveCat] = useState<string | null>(searchParams.get('cat') || null);

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => { const { data } = await api.get('/services'); return data.data; },
  });

  const categories = [...new Set((services || []).map((s: Record<string, unknown>) => s.category as string))];
  const filtered = activeCat
    ? (services || []).filter((s: Record<string, unknown>) => s.category === activeCat)
    : (services || []);

  return (
    <div className="ds-section pt-8 pb-8">
      <h1 className="text-h2">Цены</h1>
      <p className="text-base text-neutral-600 mt-2">Выберите услугу для записи</p>

      {/* Chips — 8pt gap */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide mt-6">
        <button
          onClick={() => setActiveCat(null)}
          className={`ds-chip flex-shrink-0 ${activeCat === null ? 'ds-chip-active' : 'ds-chip-inactive'}`}
        >
          Все
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`ds-chip flex-shrink-0 ${activeCat === cat ? 'ds-chip-active' : 'ds-chip-inactive'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Service list — 8pt gap between items */}
      <div className="space-y-2 mt-6">
        {filtered.map((s: Record<string, unknown>) => (
          <Link key={s.id as string} href={`/client/booking?serviceId=${s.id}`}>
            <div className="ds-card px-4 py-4 flex items-center gap-4 active:scale-[0.98] transition-transform">
              {/* Icon */}
              <div className="w-12 h-12 rounded-md bg-primary-light flex items-center justify-center flex-shrink-0">
                {s.photoPath ? (
                  <img src={`/api/uploads/${s.photoPath}`} alt="" className="w-full h-full object-cover rounded-md" />
                ) : (
                  <span className="text-primary text-xs font-bold">
                    {(s.category as string).slice(0, 3).toUpperCase()}
                  </span>
                )}
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold">{s.name as string}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-neutral-400 flex items-center gap-1">
                    <Clock size={12} /> {s.duration as number} мин
                  </span>
                </div>
              </div>
              {/* Price */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-base font-bold text-primary">
                  {(s.price as number) === 0 ? 'бесплатно' : `${(s.price as number).toLocaleString('ru')}\u00A0\u20BD`}
                </span>
                <ChevronRight size={16} className="text-neutral-200" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
