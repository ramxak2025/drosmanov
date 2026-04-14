'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import api from '@/lib/api';

export default function PromosPage() {
  const { data: promotions } = useQuery({
    queryKey: ['promos'],
    queryFn: async () => { const { data } = await api.get('/promotions'); return data.data; },
  });

  return (
    <div className="ds-section pt-8 pb-8">
      <h1 className="text-h2">Акции</h1>
      <p className="text-base text-neutral-600 mt-2">Специальные предложения</p>

      <div className="space-y-4 mt-8">
        {(promotions || []).map((p: Record<string, unknown>) => (
          <div key={p.id as string} className="ds-card p-6 relative">
            {p.photoPath && (
              <div className="-mx-6 -mt-6 mb-6 rounded-t-lg overflow-hidden h-40">
                <img src={`/api/uploads/${p.photoPath}`} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            {p.discount && (
              <div className="absolute top-4 right-4 bg-accent-red text-neutral-0 text-xs font-bold w-10 h-10 rounded-full flex items-center justify-center">
                -{p.discount as number}%
              </div>
            )}
            <h3 className="text-h3">{p.title as string}</h3>
            {p.description && (
              <p className="text-base text-neutral-600 mt-2">{p.description as string}</p>
            )}
            <div className="flex items-center gap-2 mt-4 text-sm text-neutral-400">
              <Calendar size={14} />
              до {new Date(p.endDate as string).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
