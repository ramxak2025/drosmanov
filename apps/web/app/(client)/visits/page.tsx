'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'border-l-warning',
  CONFIRMED: 'border-l-success',
  IN_PROGRESS: 'border-l-primary',
  COMPLETED: 'border-l-border',
  CANCELLED: 'border-l-error',
  NO_SHOW: 'border-l-error',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждена',
  IN_PROGRESS: 'Идёт приём',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
  NO_SHOW: 'Неявка',
};

export default function VisitsPage() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);

  const { data } = useQuery({
    queryKey: ['appointments', tab],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '50' };
      if (tab === 'upcoming') {
        params.startDate = new Date().toISOString();
      } else {
        params.endDate = new Date().toISOString();
      }
      const { data } = await api.get('/appointments', { params });
      return data.data;
    },
  });

  const appointments = data?.data || [];

  return (
    <div className="pt-2">
      <h1 className="text-xl font-bold mb-4">Мои визиты</h1>

      <div className="flex gap-2 mb-4">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-2xl text-sm font-medium transition-all ${
              tab === t ? 'bg-primary text-white' : 'bg-surface text-text-secondary'
            }`}
          >
            {t === 'upcoming' ? 'Предстоящие' : 'Прошедшие'}
          </button>
        ))}
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <p>Записей пока нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt: Record<string, unknown>, i: number) => (
            <motion.div
              key={apt.id as string}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                onClick={() => setSelected(apt)}
                className={`border-l-4 ${STATUS_COLORS[apt.status as string] || ''}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{(apt.service as Record<string, unknown>)?.name as string}</p>
                    <p className="text-sm text-text-secondary">
                      {new Date(apt.startTime as string).toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      {((apt.staff as Record<string, unknown>)?.user as Record<string, unknown>)?.name as string}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    apt.status === 'CONFIRMED' ? 'bg-success/10 text-success' :
                    apt.status === 'CANCELLED' ? 'bg-error/10 text-error' :
                    'bg-surface text-text-secondary'
                  }`}>
                    {STATUS_LABELS[apt.status as string]}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <BottomSheet isOpen={!!selected} onClose={() => setSelected(null)} title="Детали записи">
        {selected && (
          <div className="space-y-3">
            <Row label="Услуга" value={(selected.service as Record<string, unknown>)?.name as string} />
            <Row label="Врач" value={((selected.staff as Record<string, unknown>)?.user as Record<string, unknown>)?.name as string} />
            <Row label="Дата" value={new Date(selected.startTime as string).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} />
            <Row label="Время" value={`${new Date(selected.startTime as string).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} — ${new Date(selected.endTime as string).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`} />
            <Row label="Статус" value={STATUS_LABELS[selected.status as string]} />
            {selected.notes && <Row label="Заметки" value={selected.notes as string} />}

            {['PENDING', 'CONFIRMED'].includes(selected.status as string) && (
              <div className="pt-3">
                <CancelButton appointmentId={selected.id as string} startTime={selected.startTime as string} />
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

function CancelButton({ appointmentId, startTime }: { appointmentId: string; startTime: string }) {
  const hoursUntil = (new Date(startTime).getTime() - Date.now()) / 3600_000;
  if (hoursUntil < 24) return <p className="text-xs text-text-secondary">Отмена невозможна менее чем за 24 часа</p>;

  const [loading, setLoading] = useState(false);
  return (
    <Button variant="outline" size="md" loading={loading} onClick={async () => {
      setLoading(true);
      try { await api.delete(`/appointments/${appointmentId}`); window.location.reload(); } catch { setLoading(false); }
    }}>
      Отменить запись
    </Button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-secondary text-sm">{label}</span>
      <span className="font-medium text-sm text-right max-w-[60%]">{value}</span>
    </div>
  );
}
