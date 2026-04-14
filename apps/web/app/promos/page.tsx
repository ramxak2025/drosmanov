'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar, Sparkles } from 'lucide-react';
import api from '@/lib/api';

export default function PromosPage() {
  const { data: promotions } = useQuery({
    queryKey: ['promos'],
    queryFn: async () => { const { data } = await api.get('/promotions'); return data.data; },
  });

  return (
    <div className="px-6 pt-10 pb-8">
      <h1 className="text-h2">Акции</h1>
      <p className="text-base text-ink-secondary mt-2">Специальные предложения</p>

      {(!promotions || promotions.length === 0) ? (
        <div className="text-center py-20">
          <Sparkles size={32} className="text-ink-disabled mx-auto mb-4" />
          <p className="text-base text-ink-tertiary">Нет активных акций</p>
        </div>
      ) : (
        <div className="mt-8 stack-md">
          {promotions.map((p: Record<string, unknown>) => (
            <div key={p.id as string} className="bg-bg-card rounded-lg shadow-card overflow-hidden">
              {p.photoPath && (
                <div className="h-44">
                  <img src={`/api/uploads/${p.photoPath}`} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6 relative">
                {p.discount && (
                  <span className="absolute top-6 right-6 bg-status-red text-white text-sm font-extrabold
                    px-3 py-1 rounded-sm">
                    -{p.discount as number}%
                  </span>
                )}
                <h3 className="text-h3 pr-16">{p.title as string}</h3>
                {p.description && (
                  <p className="text-base text-ink-secondary mt-3 leading-relaxed">{p.description as string}</p>
                )}
                <p className="text-sm text-ink-tertiary mt-4 flex items-center gap-2">
                  <Calendar size={14} />
                  до {new Date(p.endDate as string).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
