'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-warning/10 text-warning',
  CONFIRMED: 'bg-success/10 text-success',
  IN_PROGRESS: 'bg-primary/10 text-primary',
  COMPLETED: 'bg-surface text-text-secondary',
  CANCELLED: 'bg-error/10 text-error',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает', CONFIRMED: 'Подтверждена', IN_PROGRESS: 'Идёт',
  COMPLETED: 'Завершена', CANCELLED: 'Отменена',
};

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const { data, refetch } = useQuery({
    queryKey: ['schedule', selectedDate],
    queryFn: async () => {
      const start = `${selectedDate}T00:00:00.000Z`;
      const end = `${selectedDate}T23:59:59.999Z`;
      const { data } = await api.get('/appointments', { params: { startDate: start, endDate: end, limit: '50' } });
      return data.data;
    },
  });

  const appointments = data?.data || [];

  const changeStatus = async (id: string, status: string, cancelReason?: string) => {
    await api.patch(`/appointments/${id}/status`, { status, cancelReason });
    setSelected(null);
    refetch();
  };

  return (
    <div className="pt-2">
      <h1 className="text-xl font-bold mb-4">Расписание</h1>

      {/* Date strip */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1 scrollbar-hide">
        {dates.map((d) => {
          const dateObj = new Date(d);
          const isToday = d === new Date().toISOString().split('T')[0];
          return (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`flex-shrink-0 w-14 py-2 rounded-2xl text-center transition-all ${
                selectedDate === d ? 'bg-primary text-white' : 'bg-surface'
              }`}
            >
              <p className="text-[10px]">{isToday ? 'Сегодня' : dateObj.toLocaleDateString('ru-RU', { weekday: 'short' })}</p>
              <p className="font-semibold">{dateObj.getDate()}</p>
            </button>
          );
        })}
      </div>

      {appointments.length === 0 ? (
        <p className="text-center py-16 text-text-secondary">Нет записей на этот день</p>
      ) : (
        <div className="space-y-2">
          {appointments.map((apt: Record<string, unknown>, i: number) => (
            <motion.div key={apt.id as string} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card onClick={() => setSelected(apt)}>
                <div className="flex items-center gap-3">
                  <div className="text-center min-w-[50px]">
                    <p className="font-semibold text-sm">
                      {new Date(apt.startTime as string).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] text-text-secondary">
                      {new Date(apt.endTime as string).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{((apt.client as Record<string, unknown>)?.user as Record<string, unknown>)?.name as string}</p>
                    <p className="text-xs text-text-secondary">{(apt.service as Record<string, unknown>)?.name as string}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full ${STATUS_COLORS[apt.status as string]}`}>
                    {STATUS_LABELS[apt.status as string]}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <BottomSheet isOpen={!!selected} onClose={() => setSelected(null)} title="Управление записью">
        {selected && (
          <div className="space-y-4">
            <div className="space-y-2 text-sm">
              <p><span className="text-text-secondary">Пациент:</span> {((selected.client as Record<string, unknown>)?.user as Record<string, unknown>)?.name as string}</p>
              <p><span className="text-text-secondary">Услуга:</span> {(selected.service as Record<string, unknown>)?.name as string}</p>
              <p><span className="text-text-secondary">Статус:</span> {STATUS_LABELS[selected.status as string]}</p>
            </div>
            <div className="space-y-2">
              {selected.status === 'PENDING' && (
                <Button size="lg" onClick={() => changeStatus(selected.id as string, 'CONFIRMED')}>Подтвердить</Button>
              )}
              {selected.status === 'CONFIRMED' && (
                <Button size="lg" onClick={() => changeStatus(selected.id as string, 'IN_PROGRESS')}>Начать приём</Button>
              )}
              {selected.status === 'IN_PROGRESS' && (
                <Button size="lg" onClick={() => changeStatus(selected.id as string, 'COMPLETED')}>Завершить</Button>
              )}
              {['PENDING', 'CONFIRMED'].includes(selected.status as string) && (
                <Button variant="outline" size="lg" onClick={() => changeStatus(selected.id as string, 'CANCELLED', 'Отменено врачом')}>Отменить</Button>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
