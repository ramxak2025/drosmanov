'use client';

import { useQuery } from '@tanstack/react-query';
import { Star, LogOut, Phone, User, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useRequireAuth } from '@/lib/auth';
import api from '@/lib/api';

export default function ProfilePage() {
  useRequireAuth();
  const { user, logout } = useAuth();

  // Получаем профиль клиента с бонусным балансом
  const { data: clientData } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      // Находим свой клиентский профиль через список записей (в них есть client)
      const { data } = await api.get('/appointments?limit=1');
      const apt = data.data.data?.[0];
      if (!apt) return null;
      const clientId = apt.clientId;
      const clientResp = await api.get(`/patients/${clientId}`);
      return clientResp.data.data;
    },
    enabled: user?.role === 'CLIENT',
  });

  const bonusBalance = clientData?.bonusBalance || 0;

  return (
    <div className="px-6 pt-12 pb-8">
      <h1 className="text-h2">Профиль</h1>

      {/* User card */}
      <div className="bg-bg-card rounded-lg shadow-card p-6 mt-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0">
            <User size={24} className="text-brand" />
          </div>
          <div>
            <p className="text-[15px] font-bold">{user?.name || 'Пациент'}</p>
            <p className="text-sm text-ink-secondary flex items-center gap-1 mt-1">
              <Phone size={13} /> {user?.phone}
            </p>
          </div>
        </div>
      </div>

      {/* Бонусная программа */}
      {user?.role === 'CLIENT' && (
        <div className="relative bg-gradient-to-br from-ink via-ink to-brand-dark rounded-lg p-6 mt-4 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-brand/20 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Star size={14} className="text-brand-muted" />
              <p className="text-[10px] font-bold text-white/80 tracking-widest uppercase">
                Бонусный счёт
              </p>
            </div>
            <p className="text-[34px] font-extrabold text-white leading-none">
              {bonusBalance.toLocaleString('ru')}
              <span className="text-[16px] font-bold text-white/60 ml-2">₽</span>
            </p>
            <p className="text-[12px] text-white/60 mt-3 leading-relaxed">
              Тратьте бонусы на&nbsp;следующий приём. 1&nbsp;бонус = 1&nbsp;₽
            </p>
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="mt-6 stack-sm">
        <MenuRow label="Мои визиты" href="/client/visits" />
        <MenuRow label="Записаться" href="/client/booking" />
      </div>

      {/* Logout */}
      <button onClick={logout}
        className="w-full mt-8 bg-bg-card rounded-lg shadow-card p-4 flex items-center gap-3 text-status-red
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

function MenuRow({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href}>
      <div className="bg-bg-card rounded-lg shadow-card p-4 flex items-center justify-between
        active:scale-[0.98] transition-transform">
        <span className="text-sm font-semibold">{label}</span>
        <ChevronRight size={16} className="text-ink-disabled" />
      </div>
    </Link>
  );
}
