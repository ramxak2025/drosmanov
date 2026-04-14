'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Tag, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';

export default function PromosPage() {
  const { data: promotions } = useQuery({
    queryKey: ['public-promos'],
    queryFn: async () => { const { data } = await api.get('/promotions'); return data.data; },
  });

  return (
    <div className="pt-2">
      <h1 className="text-xl font-bold mb-2">Акции</h1>
      <p className="text-sm text-text-secondary mb-5">Специальные предложения для наших пациентов</p>

      {(!promotions || promotions.length === 0) ? (
        <div className="text-center py-16">
          <Tag size={40} className="text-text-secondary/30 mx-auto mb-3" />
          <p className="text-text-secondary">Нет активных акций</p>
        </div>
      ) : (
        <div className="space-y-4">
          {promotions.map((p: Record<string, unknown>, i: number) => (
            <motion.div
              key={p.id as string}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                {p.photoPath && (
                  <div className="relative -mx-4 -mt-4 mb-3 rounded-t-[20px] overflow-hidden h-40">
                    <img src={`/api/uploads/${p.photoPath}`} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{p.title as string}</h3>
                    {p.description && (
                      <p className="text-sm text-text-secondary mt-2">{p.description as string}</p>
                    )}
                    <div className="flex items-center gap-1 mt-3 text-xs text-text-secondary">
                      <Calendar size={12} />
                      до {new Date(p.endDate as string).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                    </div>
                  </div>
                  {p.discount && (
                    <span className="text-sm bg-error text-white px-3 py-1.5 rounded-2xl font-bold flex-shrink-0 ml-3">
                      -{p.discount as number}%
                    </span>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
