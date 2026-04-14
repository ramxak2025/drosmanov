'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { useRequireAuth } from '@/lib/auth';
import api from '@/lib/api';

const STATUS: Record<string, { label: string; color: string }> = {
  PENDING:     { label: 'Ожидает',     color: 'bg-brand-subtle text-brand-dark' },
  CONFIRMED:   { label: 'Подтв.',      color: 'bg-status-green/10 text-status-green' },
  IN_PROGRESS: { label: 'Идёт',        color: 'bg-brand/15 text-brand' },
  COMPLETED:   { label: 'Завершена',   color: 'bg-ink-disabled/20 text-ink-secondary' },
  CANCELLED:   { label: 'Отменена',    color: 'bg-status-red/10 text-status-red' },
  NO_SHOW:     { label: 'Неявка',      color: 'bg-status-red/10 text-status-red' },
};

export default function SchedulePage() {
  useRequireAuth(['STAFF']);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const { data } = useQuery({
    queryKey: ['schedule', date],
    queryFn: async () => {
      const { data } = await api.get('/appointments', {
        params: { startDate: `${date}T00:00:00.000Z`, endDate: `${date}T23:59:59.999Z`, limit: '50' },
      });
      return data.data;
    },
  });

  const items = data?.data || [];

  return (
    <div className="px-6 pt-12 pb-8">
      <h1 className="text-h2">Расписание</h1>

      {/* Date strip */}
      <div className="flex gap-2 overflow-x-auto -mx-6 px-6 mt-6 pb-1 scrollbar-hide">
        {days.map((d) => {
          const dt = new Date(d);
          const today = d === new Date().toISOString().split('T')[0];
          return (
            <button key={d} onClick={() => setDate(d)}
              className={`flex-shrink-0 w-[60px] py-3 rounded-md text-center transition-all
                ${date === d ? 'bg-brand text-white shadow-button' : 'bg-bg-card shadow-soft'}`}>
              <p className={`text-[10px] font-semibold ${date === d ? 'text-white/80' : 'text-ink-tertiary'}`}>
                {today ? 'Сегодня' : dt.toLocaleDateString('ru-RU', { weekday: 'short' })}
              </p>
              <p className={`text-md font-extrabold ${date === d ? 'text-white' : 'text-ink'}`}>
                {dt.getDate()}
              </p>
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Clock size={32} className="text-ink-disabled mx-auto mb-4" />
          <p className="text-sm text-ink-tertiary">Нет записей на этот день</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((apt: Record<string, unknown>) => {
            const s = STATUS[apt.status as string] || STATUS.PENDING;
            return (
              <div key={apt.id as string} className="bg-bg-card rounded-lg shadow-card p-5">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[50px]">
                    <p className="text-md font-extrabold">
                      {new Date(apt.startTime as string).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] text-ink-tertiary mt-0.5">
                      {new Date(apt.endTime as string).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">
                      {((apt.client as Record<string, unknown>)?.user as Record<string, unknown>)?.name as string}
                    </p>
                    <p className="text-xs text-ink-tertiary mt-1 truncate">
                      {(apt.service as Record<string, unknown>)?.name as string}
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-sm ${s.color}`}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
