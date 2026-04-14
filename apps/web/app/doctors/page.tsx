'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import api from '@/lib/api';

const D: Record<string, string> = { mon:'Пн', tue:'Вт', wed:'Ср', thu:'Чт', fri:'Пт', sat:'Сб', sun:'Вс' };

export default function DoctorsPage() {
  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => { const { data } = await api.get('/staff'); return data.data; },
  });

  return (
    <div className="px-6 pt-10 pb-8">
      <h1 className="text-h2">Врачи</h1>
      <p className="text-base text-ink-secondary mt-2">Опытные специалисты</p>

      <div className="mt-8 space-y-4">
        {(staff || []).filter((s: Record<string, unknown>) => s.isActive).map((s: Record<string, unknown>) => {
          const name = (s.user as Record<string, unknown>)?.name as string || '';
          const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2);
          const sched = s.workSchedule as Record<string, { start: string; end: string } | null> | null;
          const days = sched
            ? Object.entries(sched).filter(([,v]) => v).map(([k,v]) =>
                `${D[k]} ${(v as {start:string}).start}–${(v as {end:string}).end}`)
            : [];

          return (
            <div key={s.id as string} className="bg-bg-card rounded-lg p-6 shadow-card">
              <div className="flex gap-5">
                <div className="w-16 h-16 rounded-md bg-brand-light flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-extrabold text-brand-dark">{initials}</span>
                </div>
                <div>
                  <h3 className="text-md font-bold">{name}</h3>
                  <p className="text-sm text-brand font-semibold mt-1">{s.specialty as string}</p>
                  {s.bio && <p className="text-sm text-ink-secondary mt-3 leading-relaxed">{s.bio as string}</p>}
                </div>
              </div>
              {days.length > 0 && (
                <div className="mt-5 pt-5 border-t border-line">
                  <p className="text-xs text-ink-tertiary font-bold uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
                    <Calendar size={12} /> Расписание
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {days.map((d) => (
                      <span key={d} className="text-caption bg-brand-subtle text-brand-dark px-3 py-[6px] rounded-sm font-semibold">
                        {d}
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
