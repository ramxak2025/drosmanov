'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Calendar, UserPlus, Ban } from 'lucide-react';
import { useRequireAuth } from '@/lib/auth';
import api from '@/lib/api';

export default function DashboardPage() {
  useRequireAuth(['OWNER']);
  const [period, setPeriod] = useState('today');

  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview', period],
    queryFn: async () => {
      const { data } = await api.get('/analytics/overview', { params: { period } });
      return data.data;
    },
  });

  const { data: topServices } = useQuery({
    queryKey: ['analytics', 'top-services'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/top-services', { params: { period: 'month', limit: '5' } });
      return data.data;
    },
  });

  return (
    <div className="px-6 pt-12 pb-8">
      <h1 className="text-h2">Дашборд</h1>
      <p className="text-[15px] text-ink-secondary mt-2">Статистика клиники</p>

      {/* Period tabs */}
      <div className="flex gap-1 bg-brand-subtle rounded-md p-1 mt-6">
        {[
          { k: 'today', l: 'Сегодня' },
          { k: 'week', l: 'Неделя' },
          { k: 'month', l: 'Месяц' },
        ].map(({ k, l }) => (
          <button key={k} onClick={() => setPeriod(k)}
            className={`flex-1 py-2.5 rounded-sm text-sm font-semibold transition-all
              ${period === k ? 'bg-bg-card shadow-soft text-ink' : 'text-ink-secondary'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <KpiCard icon={TrendingUp} label="Выручка" value={`${(overview?.revenue || 0).toLocaleString('ru')} \u20BD`} color="text-status-green" />
        <KpiCard icon={Calendar} label="Записей" value={String(overview?.appointmentsTotal || 0)} color="text-brand" />
        <KpiCard icon={UserPlus} label="Новых клиентов" value={String(overview?.newClients || 0)} color="text-status-green" />
        <KpiCard icon={Ban} label="Отмен" value={String(overview?.appointmentsCancelled || 0)} color="text-status-red" />
      </div>

      {/* Средний чек */}
      {overview?.averageCheck !== undefined && (
        <div className="bg-bg-card rounded-lg shadow-card p-5 mt-3">
          <p className="text-[11px] text-ink-tertiary font-semibold uppercase tracking-wider">Средний чек</p>
          <p className="text-h3 mt-2">{(overview.averageCheck || 0).toLocaleString('ru')} ₽</p>
        </div>
      )}

      {/* Top services */}
      {topServices && topServices.length > 0 && (
        <div className="mt-10">
          <h2 className="text-h3 mb-4">Топ услуг (месяц)</h2>
          <div className="space-y-3">
            {topServices.map((s: { service: string; count: number; revenue: number }, i: number) => (
              <div key={s.service} className="bg-bg-card rounded-lg shadow-card p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-sm bg-brand-subtle flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-extrabold text-brand">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{s.service}</p>
                  <p className="text-xs text-ink-tertiary mt-0.5">{s.count} записей</p>
                </div>
                <span className="text-sm font-extrabold text-brand">
                  {s.revenue.toLocaleString('ru')} ₽
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string; color: string;
}) {
  return (
    <div className="bg-bg-card rounded-lg shadow-card p-5">
      <Icon size={20} className={color} />
      <p className="text-[17px] font-extrabold mt-3">{value}</p>
      <p className="text-[11px] text-ink-tertiary font-medium mt-1">{label}</p>
    </div>
  );
}
