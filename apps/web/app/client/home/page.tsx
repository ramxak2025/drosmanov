'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { CalendarDays, Clock, FileText, ChevronRight } from 'lucide-react';
import { useAuth, useRequireAuth } from '@/lib/auth';
import api from '@/lib/api';

export default function ClientHome() {
  useRequireAuth(['CLIENT']);
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: async () => {
      const { data } = await api.get('/appointments', {
        params: { startDate: new Date().toISOString(), limit: '3' },
      });
      return data.data;
    },
  });

  const appointments = data?.data || [];
  const nameParts = user?.name?.split(' ') || [];
  const firstName = nameParts[1] || nameParts[0] || 'Пациент';

  return (
    <div className="px-6 pt-12 pb-8">
      <p className="text-sm text-ink-secondary">{greeting()}</p>
      <h1 className="text-h2 mt-1">{firstName}</h1>

      <div className="grid grid-cols-2 gap-3 mt-8">
        <Link href="/client/booking">
          <div className="bg-brand text-white rounded-lg p-5 flex flex-col items-center gap-3
            active:scale-[0.97] transition-transform shadow-button">
            <CalendarDays size={24} />
            <p className="text-sm font-bold">Записаться</p>
          </div>
        </Link>
        <Link href="/client/visits">
          <div className="bg-bg-card rounded-lg shadow-card p-5 flex flex-col items-center gap-3
            active:scale-[0.97] transition-transform">
            <FileText size={24} className="text-brand" />
            <p className="text-sm font-bold">Мои визиты</p>
          </div>
        </Link>
      </div>

      <div className="mt-10">
        <h2 className="text-h3 mb-4">Ближайшие записи</h2>
        {appointments.length === 0 ? (
          <div className="bg-bg-card rounded-lg shadow-card p-8 text-center">
            <CalendarDays size={28} className="text-ink-disabled mx-auto mb-3" />
            <p className="text-sm text-ink-tertiary">Нет предстоящих записей</p>
            <Link href="/client/booking" className="text-sm text-brand font-semibold mt-3 inline-block">
              Записаться на приём
            </Link>
          </div>
        ) : (
          <div className="stack">
            {appointments.map((apt: Record<string, unknown>) => (
              <Link key={apt.id as string} href="/client/visits">
                <div className="bg-bg-card rounded-lg shadow-card p-5 flex items-center gap-4
                  active:scale-[0.98] transition-transform">
                  <div className="w-11 h-11 rounded-md bg-brand-subtle flex items-center justify-center flex-shrink-0">
                    <Clock size={18} className="text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{(apt.service as Record<string, unknown>)?.name as string}</p>
                    <p className="text-[12px] text-ink-tertiary mt-1">
                      {new Date(apt.startTime as string).toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-ink-disabled" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}
