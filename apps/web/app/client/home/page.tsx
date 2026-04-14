'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, Star } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

export default function ClientHomePage() {
  const { user } = useAuth();

  const { data: appointments } = useQuery({
    queryKey: ['appointments', 'upcoming'],
    queryFn: async () => {
      const { data } = await api.get('/appointments', {
        params: { status: 'CONFIRMED', startDate: new Date().toISOString(), limit: 3 },
      });
      return data.data.data;
    },
  });

  return (
    <div className="space-y-6 pt-2">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Пациент'}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Клиника Dr. Osmanov
        </p>
      </motion.div>

      <Link href="/client/booking">
        <Button size="lg">
          <CalendarDays size={20} />
          Записаться на приём
        </Button>
      </Link>

      {appointments && appointments.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3">Ближайшие записи</h2>
          <div className="space-y-3">
            {appointments.map((apt: Record<string, unknown>, i: number) => (
              <motion.div
                key={apt.id as string}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Clock size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{(apt.service as Record<string, unknown>)?.name as string}</p>
                      <p className="text-sm text-text-secondary">
                        {new Date(apt.startTime as string).toLocaleDateString('ru-RU', {
                          day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                      <p className="text-sm text-text-secondary">
                        Врач: {((apt.staff as Record<string, unknown>)?.user as Record<string, unknown>)?.name as string}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-semibold mb-3">Быстрые действия</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/client/visits">
            <Card className="text-center py-6">
              <FileTextIcon />
              <p className="text-sm font-medium mt-2">Мои визиты</p>
            </Card>
          </Link>
          <Link href="/client/documents">
            <Card className="text-center py-6">
              <Star size={24} className="text-primary mx-auto" />
              <p className="text-sm font-medium mt-2">Документы</p>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}

function FileTextIcon() {
  return <CalendarDays size={24} className="text-primary mx-auto" />;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}
