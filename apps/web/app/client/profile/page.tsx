'use client';

import { Star, LogOut, Phone, User, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useRequireAuth } from '@/lib/auth';

export default function ProfilePage() {
  useRequireAuth();
  const { user, logout } = useAuth();

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

      {/* Bonus */}
      <div className="bg-bg-card rounded-lg shadow-card p-5 mt-3 flex items-center gap-4">
        <div className="w-10 h-10 rounded-md bg-brand-subtle flex items-center justify-center">
          <Star size={18} className="text-brand" />
        </div>
        <div>
          <p className="text-[11px] text-ink-tertiary font-medium">Бонусный баланс</p>
          <p className="text-[17px] font-extrabold mt-0.5">0 баллов</p>
        </div>
      </div>

      {/* Menu */}
      <div className="mt-6 stack-sm">
        <MenuRow label="Мои визиты" href="/client/visits" />
        <MenuRow label="Мои документы" href="/client/documents" />
      </div>

      {/* Logout */}
      <button onClick={logout}
        className="w-full mt-8 bg-bg-card rounded-lg shadow-card p-4 flex items-center gap-3 text-status-red
          active:scale-[0.98] transition-transform">
        <LogOut size={18} />
        <span className="text-sm font-semibold">Выйти</span>
      </button>

      {/* Back to site */}
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
