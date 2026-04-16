'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Calendar, FileText, Download, X } from 'lucide-react';
import { useAuth, useRequireAuth } from '@/lib/auth';
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
  const { user } = useAuth();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: visits } = useQuery({
    queryKey: ['visits', tab],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '50' };
      if (tab === 'upcoming') params.startDate = new Date().toISOString();
      else params.endDate = new Date().toISOString();
      const { data } = await api.get('/appointments', { params });
      return data.data;
    },
  });

  const items = visits?.data || [];
  const opened = items.find((a: Record<string, unknown>) => a.id === openId);

  return (
    <div className="px-6 pt-12 pb-8">
      <h1 className="text-h2">Мои визиты</h1>
      <p className="text-[14px] text-ink-secondary mt-2">История посещений и записи</p>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-subtle rounded-md p-1 mt-6">
        {(['upcoming', 'past'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-sm text-sm font-semibold transition-all
              ${tab === t ? 'bg-bg-card shadow-soft text-ink' : 'text-ink-secondary'}`}>
            {t === 'upcoming' ? 'Предстоящие' : 'История'}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Calendar size={32} className="text-ink-disabled mx-auto mb-4" />
          <p className="text-sm text-ink-tertiary">
            {tab === 'upcoming' ? 'Нет предстоящих записей' : 'История пуста'}
          </p>
        </div>
      ) : (
        <div className="mt-6 stack">
          {items.map((apt: Record<string, unknown>) => {
            const s = STATUS[apt.status as string] || STATUS.PENDING;
            return (
              <button key={apt.id as string} onClick={() => setOpenId(apt.id as string)}
                className="text-left bg-bg-card rounded-lg shadow-card p-5
                  active:scale-[0.98] transition-transform">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold">{(apt.service as Record<string, unknown>)?.name as string}</p>
                    <p className="text-[12px] text-ink-tertiary mt-1">
                      {((apt.staff as Record<string, unknown>)?.user as Record<string, unknown>)?.name as string}
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-sm flex-shrink-0 ${s.color}`}>
                    {s.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[12px] text-ink-secondary">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(apt.startTime as string).toLocaleDateString('ru-RU', {
                      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {opened && user && (
        <VisitDetailsModal
          appointment={opened}
          clientId={opened.clientId as string}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

function VisitDetailsModal({ appointment, clientId, onClose }: {
  appointment: Record<string, unknown>;
  clientId: string;
  onClose: () => void;
}) {
  // Медицинские записи по клиенту
  const { data: records } = useQuery({
    queryKey: ['med-records', clientId],
    queryFn: async () => {
      const { data } = await api.get(`/med-records?clientId=${clientId}`);
      return data.data;
    },
  });

  // Находим запись связанную с этим визитом (по дате)
  const aptDate = new Date(appointment.startTime as string);
  const aptDateStr = aptDate.toISOString().split('T')[0];
  const visitRecord = (records || []).find((r: Record<string, unknown>) => {
    const rDate = new Date(r.date as string).toISOString().split('T')[0];
    return rDate === aptDateStr;
  });

  const s = STATUS[appointment.status as string] || STATUS.PENDING;
  const docs = (visitRecord?.documents as Record<string, unknown>[]) || [];

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div className="w-full max-w-page mx-auto bg-bg rounded-t-xl max-h-[92vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-bg/95 backdrop-blur-xl z-10 flex justify-between items-center px-6 pt-5 pb-3 border-b border-line">
          <div className="w-10" />
          <div className="w-10 h-1 bg-line-strong rounded-full" />
          <button onClick={onClose}
            className="w-10 h-10 rounded-full bg-bg-card shadow-soft flex items-center justify-center active:scale-95">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pb-8">
          <h2 className="text-h3">{(appointment.service as Record<string, unknown>)?.name as string}</h2>
          <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-sm mt-3 ${s.color}`}>
            {s.label}
          </span>

          {/* Основная информация */}
          <div className="bg-bg-card rounded-lg shadow-card p-5 mt-6 stack-sm">
            <Row label="Врач" value={((appointment.staff as Record<string, unknown>)?.user as Record<string, unknown>)?.name as string} />
            <Row label="Дата" value={aptDate.toLocaleDateString('ru-RU', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })} />
            {appointment.notes ? <Row label="Ваш комментарий" value={String(appointment.notes)} /> : null}
          </div>

          {/* Мед. запись */}
          {visitRecord && (
            <div className="mt-8">
              <h3 className="text-sm font-bold text-ink-secondary uppercase tracking-wider mb-3">Заключение врача</h3>
              <div className="bg-bg-card rounded-lg shadow-card p-5 stack">
                <div>
                  <p className="text-[11px] text-ink-tertiary font-semibold">Диагноз</p>
                  <p className="text-sm font-semibold mt-1">{visitRecord.diagnosis as string}</p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-tertiary font-semibold">Лечение</p>
                  <p className="text-sm mt-1 leading-relaxed">{visitRecord.treatment as string}</p>
                </div>
                {visitRecord.notes ? (
                  <div>
                    <p className="text-[11px] text-ink-tertiary font-semibold">Рекомендации</p>
                    <p className="text-sm mt-1 leading-relaxed">{String(visitRecord.notes)}</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Документы и снимки */}
          {docs.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-bold text-ink-secondary uppercase tracking-wider mb-3">
                Снимки и документы
              </h3>
              <div className="stack-sm">
                {docs.map((d) => (
                  <a key={d.id as string} href={`/api/documents/${d.id}/download`} target="_blank" rel="noreferrer"
                    className="bg-bg-card rounded-md shadow-soft p-4 flex items-center gap-4
                      active:scale-[0.98] transition-transform">
                    <div className="w-10 h-10 rounded-md bg-brand-subtle flex items-center justify-center">
                      <FileText size={18} className="text-brand-dark" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{d.originalName as string}</p>
                      <p className="text-[11px] text-ink-tertiary mt-0.5">
                        {new Date(d.uploadedAt as string).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <Download size={16} className="text-brand" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {!visitRecord && appointment.status === 'COMPLETED' && (
            <div className="bg-bg-card rounded-lg shadow-card p-6 mt-8 text-center">
              <FileText size={28} className="text-ink-disabled mx-auto mb-3" />
              <p className="text-sm text-ink-tertiary">Заключение врача пока не добавлено</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-ink-tertiary font-semibold">{label}</p>
      <p className="text-sm font-medium mt-1">{value}</p>
    </div>
  );
}
