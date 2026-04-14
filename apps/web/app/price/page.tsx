'use client';

import { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function PricePage() {
  return (
    <Suspense fallback={<div className="px-6 pt-10"><h1 className="text-h2">Цены</h1></div>}>
      <Content />
    </Suspense>
  );
}

function Content() {
  const sp = useSearchParams();
  const [active, setActive] = useState<string | null>(sp.get('cat') || null);

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => { const { data } = await api.get('/services'); return data.data; },
  });

  const cats = [...new Set((services || []).map((s: Record<string, unknown>) => s.category as string))];
  const list = active ? (services || []).filter((s: Record<string, unknown>) => s.category === active) : (services || []);

  return (
    <div className="px-6 pt-10 pb-8">
      <h1 className="text-h2">Цены</h1>
      <p className="text-base text-ink-secondary mt-2">Нажмите на услугу для записи</p>

      {/* Chips */}
      <div className="flex gap-2 overflow-x-auto -mx-6 px-6 mt-6 pb-1 scrollbar-hide">
        <Chip label="Все" on={active === null} tap={() => setActive(null)} />
        {cats.map((c) => <Chip key={c} label={c} on={active === c} tap={() => setActive(c)} />)}
      </div>

      {/* List */}
      <div className="mt-6 space-y-3">
        {list.map((s: Record<string, unknown>) => (
          <Link key={s.id as string} href={`/client/booking?serviceId=${s.id}`}>
            <div className="bg-bg-card rounded-md px-5 py-4 shadow-card flex items-center gap-4
              active:scale-[0.98] transition-transform">

              <div className="w-11 h-11 rounded-sm bg-brand-subtle flex items-center justify-center flex-shrink-0">
                {s.photoPath ? (
                  <img src={`/api/uploads/${s.photoPath}`} alt="" className="w-full h-full object-cover rounded-sm" />
                ) : (
                  <span className="text-brand-dark text-xs font-extrabold">
                    {(s.category as string).slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold">{s.name as string}</p>
                <p className="text-sm text-ink-tertiary mt-1 flex items-center gap-1">
                  <Clock size={12} /> {s.duration as number} мин
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-md font-extrabold text-brand">
                  {(s.price as number) === 0 ? 'бесплатно' : `${(s.price as number).toLocaleString('ru')}\u00A0\u20BD`}
                </span>
                <ChevronRight size={15} className="text-ink-disabled" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Chip({ label, on, tap }: { label: string; on: boolean; tap: () => void }) {
  return (
    <button onClick={tap}
      className={`flex-shrink-0 px-5 py-[10px] rounded-sm text-sm font-semibold transition-all
        ${on
          ? 'bg-brand text-white shadow-button'
          : 'bg-bg-card text-ink-secondary shadow-soft'
        }`}>
      {label}
    </button>
  );
}
