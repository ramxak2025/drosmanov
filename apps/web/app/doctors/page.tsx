'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Clock, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';

const DAY_NAMES: Record<string, string> = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс',
};

export default function DoctorsPage() {
  const { data: staff } = useQuery({
    queryKey: ['public-staff'],
    queryFn: async () => { const { data } = await api.get('/staff'); return data.data; },
  });

  return (
    <div className="pt-2">
      <h1 className="text-xl font-bold mb-2">Наши врачи</h1>
      <p className="text-sm text-text-secondary mb-5">Опытные специалисты с многолетним стажем</p>

      <div className="space-y-4">
        {(staff || []).filter((s: Record<string, unknown>) => s.isActive).map((s: Record<string, unknown>, i: number) => {
          const schedule = s.workSchedule as Record<string, { start: string; end: string } | null> | null;
          const workDays = schedule
            ? Object.entries(schedule)
                .filter(([, v]) => v !== null)
                .map(([day, v]) => `${DAY_NAMES[day]} ${(v as { start: string }).start}-${(v as { end: string }).end}`)
            : [];

          return (
            <motion.div
              key={s.id as string}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {s.photoPath ? (
                      <img src={`/api/uploads/${s.photoPath}`} alt="" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <User size={28} className="text-primary" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold">{(s.user as Record<string, unknown>)?.name as string}</h3>
                    <p className="text-sm text-primary font-medium">{s.specialty as string}</p>
                    {s.bio && (
                      <p className="text-xs text-text-secondary mt-1">{s.bio as string}</p>
                    )}
                    {workDays.length > 0 && (
                      <div className="flex items-start gap-1 mt-2">
                        <Calendar size={12} className="text-text-secondary mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          {workDays.join(' · ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
