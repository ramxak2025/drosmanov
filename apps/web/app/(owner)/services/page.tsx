'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';

export default function OwnerServicesPage() {
  const { data: services } = useQuery({
    queryKey: ['owner-services'],
    queryFn: async () => { const { data } = await api.get('/services?isActive=true'); return data.data; },
  });

  // Group by category
  const grouped: Record<string, Record<string, unknown>[]> = {};
  (services || []).forEach((s: Record<string, unknown>) => {
    const cat = s.category as string;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  });

  return (
    <div className="pt-2">
      <h1 className="text-xl font-bold mb-4">Каталог услуг</h1>
      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="mb-6">
          <h2 className="font-semibold mb-2 text-text-secondary text-sm uppercase tracking-wide">{category}</h2>
          <div className="space-y-2">
            {items.map((s) => (
              <Card key={s.id as string}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{s.name as string}</p>
                    <p className="text-xs text-text-secondary">{s.duration as number} мин</p>
                  </div>
                  <span className="font-semibold text-primary">{(s.price as number).toLocaleString('ru')} &#8381;</span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
