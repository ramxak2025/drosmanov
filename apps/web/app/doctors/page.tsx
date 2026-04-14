'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar, Award } from 'lucide-react';
import api from '@/lib/api';

const D: Record<string, string> = { mon:'Пн', tue:'Вт', wed:'Ср', thu:'Чт', fri:'Пт', sat:'Сб', sun:'Вс' };

export default function DoctorsPage() {
  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => { const { data } = await api.get('/staff'); return data.data; },
  });

  return (
    <div className="px-6 pt-12 pb-8">
      <h1 className="text-h2">Наши врачи</h1>
      <p className="text-[15px] text-ink-secondary mt-2 mb-8">Опытные специалисты</p>

      <div className="stack-lg">
        {(staff || []).filter((s: Record<string, unknown>) => s.isActive).map((s: Record<string, unknown>) => {
          const name = (s.user as Record<string, unknown>)?.name as string || '';
          const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2);
          const sched = s.workSchedule as Record<string, { start: string; end: string } | null> | null;
          const days = sched
            ? Object.entries(sched).filter(([,v]) => v).map(([k,v]) =>
                `${D[k]} ${(v as {start:string}).start}–${(v as {end:string}).end}`)
            : [];

          return (
            <div key={s.id as string} className="bg-bg-card rounded-lg shadow-card overflow-hidden">
              {/* Большое фото / аватар */}
              <div className="h-48 bg-gradient-to-br from-brand-light to-brand-subtle flex items-center justify-center">
                {s.photoPath ? (
                  <img src={`/api/uploads/${s.photoPath}`} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[48px] font-extrabold text-brand/30">{initials}</span>
                )}
              </div>

              {/* Инфо */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-h3">{name}</h3>
                    <p className="text-sm text-brand font-semibold mt-1">{s.specialty as string}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-brand-subtle flex items-center justify-center flex-shrink-0">
                    <Award size={18} className="text-brand" />
                  </div>
                </div>

                {s.bio && (
                  <p className="text-sm text-ink-secondary mt-4 leading-relaxed">{s.bio as string}</p>
                )}

                {days.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-line">
                    <p className="text-[11px] text-ink-tertiary font-bold uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
                      <Calendar size={12} /> Расписание
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {days.map((d) => (
                        <span key={d} className="text-[11px] bg-brand-subtle text-brand-dark px-3 py-[6px] rounded-sm font-semibold">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
