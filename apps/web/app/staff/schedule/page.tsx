'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, X, Phone } from 'lucide-react';
import Link from 'next/link';
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

const STATUS_ACTIONS: { value: string; label: string; color: string }[] = [
  { value: 'CONFIRMED',   label: 'Подтвердить',  color: 'bg-status-green text-white' },
  { value: 'IN_PROGRESS', label: 'Начать приём',  color: 'bg-brand text-white' },
  { value: 'COMPLETED',   label: 'Завершить',     color: 'bg-ink text-white' },
  { value: 'CANCELLED',   label: 'Отменить',      color: 'bg-status-red text-white' },
  { value: 'NO_SHOW',     label: 'Неявка',        color: 'bg-status-red/80 text-white' },
];

export default function SchedulePage() {
  useRequireAuth(['STAFF']);
  const qc = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [openId, setOpenId] = useState<string | null>(null);

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

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/appointments/${id}/status`, { status });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule', date] });
      setOpenId(null);
    },
  });

  const items = data?.data || [];
  const opened = items.find((a: Record<string, unknown>) => a.id === openId);

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
        <div className="mt-6 stack">
          {items.map((apt: Record<string, unknown>) => {
            const s = STATUS[apt.status as string] || STATUS.PENDING;
            const clientName = ((apt.client as Record<string, unknown>)?.user as Record<string, unknown>)?.name as string;
            const clientPhone = ((apt.client as Record<string, unknown>)?.user as Record<string, unknown>)?.phone as string;
            return (
              <button key={apt.id as string} onClick={() => setOpenId(apt.id as string)}
                className="text-left bg-bg-card rounded-lg shadow-card p-5 active:scale-[0.98] transition-transform">
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
                    <p className="text-sm font-bold truncate">{clientName}</p>
                    <p className="text-xs text-ink-tertiary mt-1 truncate">
                      {(apt.service as Record<string, unknown>)?.name as string}
                    </p>
                    {clientPhone && (
                      <p className="text-[11px] text-ink-disabled mt-0.5 flex items-center gap-1">
                        <Phone size={10} /> {clientPhone}
                      </p>
                    )}
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-sm ${s.color}`}>
                    {s.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Модалка управления статусом */}
      {opened && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end" onClick={() => setOpenId(null)}>
          <div className="w-full max-w-page mx-auto bg-bg rounded-t-xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 pt-5 pb-3 border-b border-line">
              <div className="w-10" />
              <div className="w-10 h-1 bg-line-strong rounded-full" />
              <button onClick={() => setOpenId(null)}
                className="w-10 h-10 rounded-full bg-bg-card shadow-soft flex items-center justify-center active:scale-95">
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-6">
              <p className="text-[12px] text-ink-tertiary font-semibold uppercase tracking-wider mb-1">Пациент</p>
              <p className="text-[16px] font-bold">
                {((opened.client as Record<string, unknown>)?.user as Record<string, unknown>)?.name as string}
              </p>
              <p className="text-sm text-ink-secondary mt-1">
                {(opened.service as Record<string, unknown>)?.name as string} ·{' '}
                {new Date(opened.startTime as string).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </p>

              <Link href={`/staff/patients/${(opened.client as Record<string, unknown>)?.id}`}
                className="text-[13px] text-brand font-semibold mt-3 inline-block">
                Открыть карту пациента →
              </Link>

              <p className="text-[12px] text-ink-tertiary font-semibold uppercase tracking-wider mt-6 mb-3">Изменить статус</p>
              <div className="grid grid-cols-2 gap-2 pb-4">
                {STATUS_ACTIONS
                  .filter(a => a.value !== (opened.status as string))
                  .map((a) => (
                    <button key={a.value}
                      onClick={() => updateStatus.mutate({ id: opened.id as string, status: a.value })}
                      disabled={updateStatus.isPending}
                      className={`py-3 rounded-md text-[13px] font-bold active:scale-[0.97] transition-transform
                        disabled:opacity-40 ${a.color}`}>
                      {a.label}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
