'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Calendar } from 'lucide-react';
import { useRequireAuth } from '@/lib/auth';
import api from '@/lib/api';

const STATUS: Record<string, { label: string; color: string }> = {
  PENDING:     { label: 'Ожидает',     color: 'bg-brand-subtle text-brand-dark' },
  CONFIRMED:   { label: 'Подтверждена', color: 'bg-status-green/10 text-status-green' },
  IN_PROGRESS: { label: 'Идёт приём',  color: 'bg-brand/15 text-brand' },
  COMPLETED:   { label: 'Завершена',   color: 'bg-ink-disabled/20 text-ink-secondary' },
  CANCELLED:   { label: 'Отменена',    color: 'bg-status-red/10 text-status-red' },
  NO_SHOW:     { label: 'Неявка',      color: 'bg-status-red/10 text-status-red' },
};

export default function VisitsPage() {
  useRequireAuth(['CLIENT']);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const { data } = useQuery({
    queryKey: ['visits', tab],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '50' };
      if (tab === 'upcoming') params.startDate = new Date().toISOString();
      else params.endDate = new Date().toISOString();
      const { data } = await api.get('/appointments', { params });
      return data.data;
    },
  });

  const items = data?.data || [];

  return (
    <div className="px-6 pt-12 pb-8">
      <h1 className="text-h2">Мои визиты</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-subtle rounded-md p-1 mt-6">
        {(['upcoming', 'past'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-sm text-sm font-semibold transition-all
              ${tab === t ? 'bg-bg-card shadow-soft text-ink' : 'text-ink-secondary'}`}>
            {t === 'upcoming' ? 'Предстоящие' : 'Прошедшие'}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Calendar size={32} className="text-ink-disabled mx-auto mb-4" />
          <p className="text-sm text-ink-tertiary">Записей пока нет</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((apt: Record<string, unknown>) => {
            const s = STATUS[apt.status as string] || STATUS.PENDING;
            return (
              <div key={apt.id as string} className="bg-bg-card rounded-lg shadow-card p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-bold">{(apt.service as Record<string, unknown>)?.name as string}</p>
                    <p className="text-xs text-ink-tertiary mt-1">
                      {((apt.staff as Record<string, unknown>)?.user as Record<string, unknown>)?.name as string}
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-sm ${s.color}`}>
                    {s.label}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-ink-secondary">
                  <Clock size={12} />
                  {new Date(apt.startTime as string).toLocaleDateString('ru-RU', {
                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
