'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { LogOut } from 'lucide-react';
import api from '@/lib/api';

export default function OwnerSettingsPage() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '', address: '', phone: '', email: '', bonusPercent: 5, ownerTelegramId: '',
  });

  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => { const { data } = await api.get('/settings'); return data.data; },
  });

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        bonusPercent: data.bonusPercent || 5,
        ownerTelegramId: data.ownerTelegramId || '',
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => { await api.patch('/settings', form); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  return (
    <div className="pt-2">
      <h1 className="text-xl font-bold mb-4">Настройки клиники</h1>

      <Card className="space-y-4 mb-6">
        <Input label="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Адрес" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <Input label="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Процент бонусов (%)" type="number" value={String(form.bonusPercent)} onChange={(e) => setForm({ ...form, bonusPercent: Number(e.target.value) })} />
        <Input label="Telegram Chat ID владельца" value={form.ownerTelegramId} onChange={(e) => setForm({ ...form, ownerTelegramId: e.target.value })} />
        <Button size="lg" loading={mutation.isPending} onClick={() => mutation.mutate()}>
          Сохранить
        </Button>
      </Card>

      <Button variant="outline" size="lg" onClick={logout}>
        <LogOut size={18} />
        Выйти
      </Button>
    </div>
  );
}
