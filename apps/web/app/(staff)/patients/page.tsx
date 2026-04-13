'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import api from '@/lib/api';

export default function PatientsListPage() {
  const [search, setSearch] = useState('');

  const { data } = useQuery({
    queryKey: ['patients', search],
    queryFn: async () => {
      const { data } = await api.get('/patients', { params: { search: search || undefined, limit: '50' } });
      return data.data;
    },
  });

  const patients = data?.data || [];

  return (
    <div className="pt-2">
      <h1 className="text-xl font-bold mb-4">Пациенты</h1>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Поиск по имени или телефону"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {patients.map((p: Record<string, unknown>, i: number) => (
          <motion.div key={p.id as string} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
            <Link href={`/staff/patients/${p.id}`}>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{(p.user as Record<string, unknown>)?.name as string}</p>
                    <p className="text-xs text-text-secondary">{(p.user as Record<string, unknown>)?.phone as string}</p>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
