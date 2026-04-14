'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, User, ChevronRight } from 'lucide-react';
import { useRequireAuth } from '@/lib/auth';
import api from '@/lib/api';

export default function PatientsListPage() {
  useRequireAuth(['STAFF', 'OWNER']);
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
    <div className="px-6 pt-12 pb-8">
      <h1 className="text-h2">Пациенты</h1>

      {/* Search */}
      <div className="relative mt-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-disabled" />
        <input
          placeholder="Поиск по имени или телефону"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-[14px] rounded-md bg-bg-card text-[15px] shadow-soft outline-none
            focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div className="mt-6 space-y-4">
        {patients.map((p: Record<string, unknown>) => (
          <Link key={p.id as string} href={`/staff/patients/${p.id}`}>
            <div className="bg-bg-card rounded-lg shadow-card p-4 flex items-center gap-4
              active:scale-[0.98] transition-transform">
              <div className="w-11 h-11 rounded-full bg-brand-subtle flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{(p.user as Record<string, unknown>)?.name as string}</p>
                <p className="text-xs text-ink-tertiary mt-1">{(p.user as Record<string, unknown>)?.phone as string}</p>
              </div>
              <ChevronRight size={16} className="text-ink-disabled" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
