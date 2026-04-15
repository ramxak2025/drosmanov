'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Users } from 'lucide-react';
import { useRequireAuth } from '@/lib/auth';
import api from '@/lib/api';

const STATUS: Record<string, { label: string; color: string }> = {
  PENDING:     { label: 'Ожидает', color: 'bg-brand-subtle text-brand-dark' },
  CONFIRMED:   { label: 'Подтв.',  color: 'bg-status-green/10 text-status-green' },
  IN_PROGRESS: { label: 'Идёт',    color: 'bg-brand/15 text-brand' },
  COMPLETED:   { label: 'Готово',  color: 'bg-ink-disabled/20 text-ink-secondary' },
  CANCELLED:   { label: 'Отмена',  color: 'bg-status-red/10 text-status-red' },
  NO_SHOW:     { label: 'Неявка',  color: 'bg-status-red/10 text-status-red' },
};

export default function OwnerSchedulePage() {
  useRequireAuth(['OWNER']);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const { data: staff } = useQuery({
    queryKey: ['all-staff-sched'],
    queryFn: async () => { const { data } = await api.get('/staff'); return data.data; },
  });

  const { data: apptsData } = useQuery({
    queryKey: ['all-appts', date],
    queryFn: async () => {
      const { data } = await api.get('/appointments', {
        params: {
          startDate: `${date}T00:00:00.000Z`,
          endDate: `${date}T23:59:59.999Z`,
          limit: '200',
        },
      });
      return data.data;
    },
  });

  const appointments = apptsData?.data || [];

  // Группируем по врачу
  const byStaff: Record<string, Record<string, unknown>[]> = {};
  (appointments as Record<string, unknown>[]).forEach((a) => {
    const id = a.staffId as string;
    if (!byStaff[id]) byStaff[id] = [];
    byStaff[id].push(a);
  });

  return (
    <div className="px-6 pt-12 pb-8">
      <h1 className="text-h2">Расписание</h1>
      <p className="text-[15px] text-ink-secondary mt-2">Все врачи на выбранный день</p>

      {/* Выбор даты */}
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

      {/* По каждому врачу — колонка с приёмами */}
      <div className="mt-6 stack-md md:grid md:grid-cols-3 md:gap-5 md:stack-none">
        {(staff || []).filter((s: Record<string, unknown>) => s.isActive).map((s: Record<string, unknown>) => {
          const name = (s.user as Record<string, unknown>)?.name as string || '';
          const list = byStaff[s.id as string] || [];
          return (
            <div key={s.id as string} className="bg-bg-card rounded-lg shadow-card p-5">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-line">
                <div className="w-10 h-10 rounded-md bg-brand-light flex items-center justify-center flex-shrink-0">
                  <Users size={18} className="text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold truncate">{name}</p>
                  <p className="text-[11px] text-brand font-semibold">{s.specialty as string}</p>
                </div>
                <span className="text-[11px] font-bold text-ink-tertiary bg-brand-subtle px-2 py-1 rounded-sm">
                  {list.length}
                </span>
              </div>

              {list.length === 0 ? (
                <p className="text-[12px] text-ink-tertiary text-center py-4">Нет приёмов</p>
              ) : (
                <div className="stack-sm">
                  {list.sort((a, b) =>
                    new Date(a.startTime as string).getTime() - new Date(b.startTime as string).getTime()
                  ).map((apt) => {
                    const st = STATUS[apt.status as string] || STATUS.PENDING;
                    return (
                      <div key={apt.id as string} className="bg-brand-subtle/40 rounded-sm p-3 flex items-start gap-3">
                        <div className="flex items-center gap-1 text-[12px] font-extrabold text-ink flex-shrink-0">
                          <Clock size={11} className="text-ink-tertiary" />
                          {new Date(apt.startTime as string).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold truncate">
                            {((apt.client as Record<string, unknown>)?.user as Record<string, unknown>)?.name as string}
                          </p>
                          <p className="text-[11px] text-ink-tertiary truncate">
                            {(apt.service as Record<string, unknown>)?.name as string}
                          </p>
                        </div>
                        <span className={`text-[10px] font-semibold px-1.5 py-[2px] rounded-full flex-shrink-0 ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
