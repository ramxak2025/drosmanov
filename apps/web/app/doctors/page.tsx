'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import api from '@/lib/api';

const DAYS: Record<string, string> = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс',
};

export default function DoctorsPage() {
  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => { const { data } = await api.get('/staff'); return data.data; },
  });

  return (
    <div className="ds-section pt-8 pb-8">
      <h1 className="text-h2">Врачи</h1>
      <p className="text-base text-neutral-600 mt-2">Опытные специалисты с многолетним стажем</p>

      <div className="space-y-4 mt-8">
        {(staff || []).filter((s: Record<string, unknown>) => s.isActive).map((s: Record<string, unknown>) => {
          const name = (s.user as Record<string, unknown>)?.name as string || '';
          const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2);
          const schedule = s.workSchedule as Record<string, { start: string; end: string } | null> | null;
          const workDays = schedule
            ? Object.entries(schedule).filter(([, v]) => v !== null)
                .map(([d, v]) => ({ d: DAYS[d], t: `${(v as { start: string }).start}–${(v as { end: string }).end}` }))
            : [];

          return (
            <div key={s.id as string} className="ds-card p-6">
              <div className="flex gap-4">
                {/* Avatar — 64px = 8*8 */}
                <div className="w-16 h-16 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold">{name}</h3>
                  <p className="text-sm text-primary font-medium mt-1">{s.specialty as string}</p>
                  {s.bio && <p className="text-sm text-neutral-600 mt-2">{s.bio as string}</p>}
                </div>
              </div>

              {workDays.length > 0 && (
                <div className="mt-6 pt-4 border-t border-neutral-200/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar size={14} className="text-neutral-400" />
                    <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Расписание</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {workDays.map(({ d, t }) => (
                      <span key={d} className="text-xs bg-primary-light text-primary px-4 py-2 rounded-sm font-medium">
                        {d} {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
