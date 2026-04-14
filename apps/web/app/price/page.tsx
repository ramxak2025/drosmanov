'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function PricePage() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get('cat') || null;
  const [activeCat, setActiveCat] = useState<string | null>(initialCat);

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => { const { data } = await api.get('/services'); return data.data; },
  });

  const categories = [...new Set((services || []).map((s: Record<string, unknown>) => s.category as string))];

  useEffect(() => {
    if (initialCat) setActiveCat(initialCat);
  }, [initialCat]);

  const filtered = activeCat
    ? (services || []).filter((s: Record<string, unknown>) => s.category === activeCat)
    : (services || []);

  return (
    <div className="pt-3 pb-6">
      <h1 className="text-[22px] font-bold mb-1">Цены</h1>
      <p className="text-[13px] text-text-secondary mb-6">Выберите услугу для записи</p>

      {/* Категории — горизонтальные чипсы */}
      <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        <ChipButton
          label="Все"
          active={activeCat === null}
          onClick={() => setActiveCat(null)}
        />
        {categories.map((cat) => (
          <ChipButton
            key={cat}
            label={cat}
            active={activeCat === cat}
            onClick={() => setActiveCat(cat)}
          />
        ))}
      </div>

      {/* Список услуг */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((s: Record<string, unknown>, i: number) => (
            <motion.div
              key={s.id as string}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link href={`/client/booking?serviceId=${s.id}`}>
                <div className="bg-white rounded-[16px] border border-border/40 px-5 py-4
                  shadow-[0_1px_3px_rgba(0,0,0,0.03)]
                  active:scale-[0.98] active:bg-primary/[0.02] transition-all
                  flex items-center gap-4">

                  {/* Фото или иконка */}
                  {s.photoPath ? (
                    <div className="w-12 h-12 rounded-[12px] overflow-hidden flex-shrink-0">
                      <img src={`/api/uploads/${s.photoPath}`} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-[12px] bg-primary/[0.06] flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-[11px] font-bold">
                        {(s.category as string).slice(0, 3).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Инфо */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold leading-snug">{s.name as string}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[12px] text-text-secondary flex items-center gap-1">
                        <Clock size={11} /> {s.duration as number} мин
                      </span>
                      {!activeCat && (
                        <span className="text-[11px] text-primary/60 bg-primary/[0.06] px-1.5 py-0.5 rounded-md">
                          {s.category as string}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Цена + стрелка */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[15px] font-bold text-primary tabular-nums">
                      {(s.price as number) === 0 ? 'бесплатно' : `${(s.price as number).toLocaleString('ru')}\u00A0\u20BD`}
                    </span>
                    <ChevronRight size={16} className="text-text-secondary/40" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ChipButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-4 py-[9px] rounded-[12px] text-[13px] font-medium transition-all
        ${active
          ? 'bg-primary text-white shadow-[0_4px_12px_rgba(201,169,110,0.25)]'
          : 'bg-white text-text-secondary border border-border/50'
        }`}
    >
      {label}
    </button>
  );
}
