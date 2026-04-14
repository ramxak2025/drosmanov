'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Users, Tag, LogIn, LayoutDashboard, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

// Публичная главная — запись, услуги, врачи
export default function HomePage() {
  const { data: services } = useQuery({
    queryKey: ['public-services'],
    queryFn: async () => { const { data } = await api.get('/services'); return data.data; },
  });

  const { data: promotions } = useQuery({
    queryKey: ['public-promos'],
    queryFn: async () => { const { data } = await api.get('/promotions'); return data.data; },
  });

  // Group services by category
  const grouped: Record<string, Record<string, unknown>[]> = {};
  (services || []).forEach((s: Record<string, unknown>) => {
    const cat = s.category as string;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  });

  return (
    <div className="space-y-6 pt-2">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-primary">DO</span>
          </div>
          <h1 className="text-2xl font-bold">Dr. Osmanov</h1>
          <p className="text-text-secondary text-sm">Стоматологическая клиника</p>
        </div>
      </motion.div>

      {/* Quick actions */}
      <Link href="/doctors">
        <Button size="lg">
          <Users size={20} />
          Наши врачи
        </Button>
      </Link>

      {/* Active promotions */}
      {promotions && promotions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Акции</h2>
            <Link href="/promos" className="text-sm text-primary">Все</Link>
          </div>
          <div className="space-y-3">
            {promotions.slice(0, 2).map((p: Record<string, unknown>) => (
              <Card key={p.id as string}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-sm">{p.title as string}</h3>
                    {p.description && <p className="text-xs text-text-secondary mt-1 line-clamp-2">{p.description as string}</p>}
                  </div>
                  {p.discount && (
                    <span className="text-xs bg-error/10 text-error px-2 py-1 rounded-full font-bold flex-shrink-0 ml-2">
                      -{p.discount as number}%
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      <section>
        <h2 className="font-semibold mb-3">Наши услуги</h2>
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-4">
            <h3 className="text-xs text-text-secondary uppercase tracking-wider mb-2">{category}</h3>
            <div className="space-y-2">
              {items.map((s) => (
                <Card key={s.id as string}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{s.name as string}</p>
                      <p className="text-xs text-text-secondary">{s.duration as number} мин</p>
                    </div>
                    <span className="font-semibold text-primary text-sm">
                      {(s.price as number) === 0 ? 'Бесплатно' : `${(s.price as number).toLocaleString('ru')} \u20BD`}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
