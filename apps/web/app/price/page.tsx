'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '@/lib/api';

export default function PricePage() {
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

  return (
    <div className="pt-2 pb-4">
      <h1 className="text-xl font-bold mb-1">Прайс-лист</h1>
      <p className="text-sm text-text-secondary mb-6">Цены указаны в рублях</p>

      {Object.entries(grouped).map(([category, items], ci) => (
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ci * 0.08 }}
          className="mb-6"
        >
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2.5 px-1">{category}</h2>
          <div className="bg-surface/60 rounded-3xl border border-border/40 overflow-hidden divide-y divide-border/40">
            {items.map((s) => (
              <div key={s.id as string} className="flex justify-between items-center px-5 py-4">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-[14px] font-medium">{s.name as string}</p>
                  {s.description && <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-1">{s.description as string}</p>}
                  <p className="text-[11px] text-text-secondary mt-0.5">{s.duration as number} мин</p>
                </div>
                <span className="text-[15px] font-bold text-primary tabular-nums flex-shrink-0">
                  {(s.price as number) === 0 ? 'бесплатно' : `${(s.price as number).toLocaleString('ru')} \u20BD`}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
