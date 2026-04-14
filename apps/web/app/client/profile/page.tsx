'use client';

import { Star, LogOut, Phone, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="pt-2">
      <h1 className="text-xl font-bold mb-6">Профиль</h1>

      <Card className="mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <User size={28} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-lg">{user?.name || 'Пациент'}</p>
            <p className="text-sm text-text-secondary flex items-center gap-1">
              <Phone size={14} /> {user?.phone}
            </p>
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <div className="flex items-center gap-3">
          <Star size={20} className="text-warning" />
          <div>
            <p className="text-sm text-text-secondary">Бонусный баланс</p>
            <p className="font-semibold text-lg">0 баллов</p>
          </div>
        </div>
      </Card>

      <div className="mt-8">
        <Button variant="outline" size="lg" onClick={logout}>
          <LogOut size={18} />
          Выйти
        </Button>
      </div>
    </div>
  );
}
