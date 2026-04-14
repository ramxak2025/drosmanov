'use client';

import { useQuery } from '@tanstack/react-query';
import { LogOut, Phone, User, Briefcase, Calendar as CalIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useRequireAuth } from '@/lib/auth';
import api from '@/lib/api';

const D: Record<string, string> = { mon:'Пн', tue:'Вт', wed:'Ср', thu:'Чт', fri:'Пт', sat:'Сб', sun:'Вс' };

export default function StaffProfilePage() {
  useRequireAuth(['STAFF']);
  const { user, logout } = useAuth();

  // Получаем профиль врача со специальностью и расписанием
  const { data: staff } = useQuery({
    queryKey: ['my-staff-profile'],
    queryFn: async () => {
      const { data } = await api.get('/staff');
      return (data.data as Record<string, unknown>[]).find(
        (s) => (s.user as Record<string, unknown>)?.phone === user?.phone
      );
    },
    enabled: !!user?.phone,
  });

  const sched = (staff?.workSchedule as Record<string, { start: string; end: string } | null> | null);
  const days = sched
    ? Object.entries(sched).filter(([,v]) => v).map(([k,v]) =>
        ({ day: D[k], start: (v as {start:string}).start, end: (v as {end:string}).end }))
    : [];

  return (
    <div className="px-6 pt-12 pb-8">
      <h1 className="text-h2">Профиль</h1>

      {/* Карточка врача */}
      <div className="bg-bg-card rounded-lg shadow-card p-6 mt-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-md bg-brand-light flex items-center justify-center flex-shrink-0 overflow-hidden">
            {staff?.photoPath ? (
              <img src={`/api/uploads/${staff.photoPath}`} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={28} className="text-brand" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold">{user?.name}</p>
            {staff?.specialty && (
              <p className="text-sm text-brand font-semibold mt-1">{staff.specialty as string}</p>
            )}
            <p className="text-xs text-ink-secondary flex items-center gap-1 mt-1">
              <Phone size={12} /> {user?.phone}
            </p>
          </div>
        </div>
      </div>

      {/* Моё расписание */}
      {days.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] text-ink-tertiary font-bold uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
            <CalIcon size={12} /> Моё расписание
          </p>
          <div className="bg-bg-card rounded-md shadow-card overflow-hidden">
            {days.map(({ day, start, end }, i) => (
              <div key={day}
                className={`px-5 py-3 flex items-center justify-between
                  ${i > 0 ? 'border-t border-line' : ''}`}>
                <span className="text-[14px] font-semibold">{day}</span>
                <span className="text-[14px] text-ink-secondary tabular-nums">{start}–{end}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <button onClick={logout}
        className="w-full mt-8 bg-bg-card rounded-lg shadow-card p-4 flex items-center justify-center gap-3 text-status-red
          active:scale-[0.98] transition-transform">
        <LogOut size={18} />
        <span className="text-sm font-semibold">Выйти</span>
      </button>

      <Link href="/" className="block text-center text-sm text-ink-tertiary mt-4 font-medium">
        На главную
      </Link>
    </div>
  );
}
