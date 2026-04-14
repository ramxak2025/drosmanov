'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, UserPlus, Ban } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';

export default function DashboardPage() {
  const [period, setPeriod] = useState('today');

  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview', period],
    queryFn: async () => {
      const { data } = await api.get('/analytics/overview', { params: { period } });
      return data.data;
    },
    staleTime: 5 * 60_000,
  });

  const { data: revenueChart } = useQuery({
    queryKey: ['analytics', 'revenue-chart', period],
    queryFn: async () => {
      const { data } = await api.get('/analytics/revenue-chart', { params: { period: 'month' } });
      return data.data;
    },
    staleTime: 5 * 60_000,
  });

  const { data: topServices } = useQuery({
    queryKey: ['analytics', 'top-services'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/top-services', { params: { period: 'month', limit: '5' } });
      return data.data;
    },
    staleTime: 5 * 60_000,
  });

  return (
    <div className="pt-2">
      <h1 className="text-xl font-bold mb-4">Дашборд</h1>

      <div className="flex gap-2 mb-4">
        {[
          { key: 'today', label: 'Сегодня' },
          { key: 'week', label: 'Неделя' },
          { key: 'month', label: 'Месяц' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`flex-1 py-2 rounded-2xl text-sm font-medium ${
              period === key ? 'bg-primary text-white' : 'bg-surface text-text-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <KpiCard icon={TrendingUp} label="Выручка" value={`${(overview?.revenue || 0).toLocaleString('ru')} \u20BD`} color="text-success" />
        <KpiCard icon={Calendar} label="Записей" value={String(overview?.appointmentsTotal || 0)} color="text-primary" />
        <KpiCard icon={UserPlus} label="Новых клиентов" value={String(overview?.newClients || 0)} color="text-warning" />
        <KpiCard icon={Ban} label="Отмен" value={String(overview?.appointmentsCancelled || 0)} color="text-error" />
      </div>

      {/* Revenue chart placeholder */}
      {revenueChart && revenueChart.length > 0 && (
        <section className="mb-6">
          <h2 className="font-semibold mb-3">Выручка за месяц</h2>
          <Card>
            <div className="h-32 flex items-end gap-1">
              {revenueChart.slice(-14).map((point: { date: string; revenue: number }, i: number) => {
                const max = Math.max(...revenueChart.map((p: { revenue: number }) => p.revenue));
                const height = max > 0 ? (point.revenue / max) * 100 : 0;
                return (
                  <motion.div
                    key={point.date}
                    className="flex-1 bg-primary rounded-t"
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.03 }}
                  />
                );
              })}
            </div>
          </Card>
        </section>
      )}

      {/* Top services */}
      {topServices && topServices.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3">Топ услуг</h2>
          <div className="space-y-2">
            {topServices.map((s: { service: string; count: number; revenue: number }, i: number) => (
              <Card key={s.service}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{i + 1}. {s.service}</p>
                    <p className="text-xs text-text-secondary">{s.count} записей</p>
                  </div>
                  <span className="font-semibold text-sm text-primary">{s.revenue.toLocaleString('ru')} &#8381;</span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string; color: string;
}) {
  return (
    <Card>
      <Icon size={20} className={color} />
      <p className="text-lg font-bold mt-2">{value}</p>
      <p className="text-xs text-text-secondary">{label}</p>
    </Card>
  );
}
