'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Calendar } from 'lucide-react';
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
    <div className="pt-3 pb-6">
      <h1 className="text-[22px] font-bold mb-1">Врачи</h1>
      <p className="text-[13px] text-text-secondary mb-6">Опытные специалисты с многолетним стажем</p>

      <div className="space-y-4">
        {(staff || []).filter((s: Record<string, unknown>) => s.isActive).map((s: Record<string, unknown>, i: number) => {
          const name = (s.user as Record<string, unknown>)?.name as string || '';
          const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
          const schedule = s.workSchedule as Record<string, { start: string; end: string } | null> | null;

          const workDays = schedule
            ? Object.entries(schedule)
                .filter(([, v]) => v !== null)
                .map(([day, v]) => ({ day: DAYS[day], start: (v as { start: string }).start, end: (v as { end: string }).end }))
            : [];

          return (
            <motion.div
              key={s.id as string}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="bg-white rounded-[20px] border border-border/40 p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-[16px] bg-primary/[0.08] flex items-center justify-center flex-shrink-0">
                    {s.photoPath ? (
                      <img src={`/api/uploads/${s.photoPath}`} alt="" className="w-full h-full object-cover rounded-[16px]" />
                    ) : (
                      <User size={26} className="text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold leading-snug">{name}</h3>
                    <p className="text-[13px] text-primary font-medium mt-0.5">{s.specialty as string}</p>
                    {s.bio && (
                      <p className="text-[12px] text-text-secondary mt-2 leading-relaxed">{s.bio as string}</p>
                    )}
                  </div>
                </div>

                {workDays.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Calendar size={13} className="text-text-secondary" />
                      <p className="text-[11px] text-text-secondary font-medium uppercase tracking-wider">Расписание</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {workDays.map(({ day, start, end }) => (
                        <span key={day} className="text-[11px] bg-primary/[0.06] text-primary px-2.5 py-1 rounded-[8px] font-medium">
                          {day} {start}–{end}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
