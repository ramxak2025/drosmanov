'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { LogOut, Building2, Users, Check, Phone, Mail, MapPin } from 'lucide-react';
import api from '@/lib/api';

export default function OwnerSettingsPage() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'clinic' | 'staff'>('clinic');

  return (
    <div className="pt-2">
      <h1 className="text-xl font-bold mb-4">Настройки</h1>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('clinic')}
          className={`flex-1 py-2.5 rounded-2xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
            tab === 'clinic' ? 'bg-primary text-white' : 'bg-surface text-text-secondary'
          }`}
        >
          <Building2 size={16} /> Клиника
        </button>
        <button
          onClick={() => setTab('staff')}
          className={`flex-1 py-2.5 rounded-2xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
            tab === 'staff' ? 'bg-primary text-white' : 'bg-surface text-text-secondary'
          }`}
        >
          <Users size={16} /> Персонал
        </button>
      </div>

      {tab === 'clinic' ? <ClinicTab /> : <StaffTab />}

      <div className="mt-8 mb-4">
        <Button variant="outline" size="lg" onClick={logout}>
          <LogOut size={18} /> Выйти
        </Button>
      </div>
    </div>
  );
}

function ClinicTab() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '', address: '', phone: '', email: '', bonusPercent: 5, ownerTelegramId: '',
  });
  const [saved, setSaved] = useState(false);

  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => { const { data } = await api.get('/settings'); return data.data; },
  });

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name || '', address: data.address || '', phone: data.phone || '',
        email: data.email || '', bonusPercent: data.bonusPercent || 5,
        ownerTelegramId: data.ownerTelegramId || '',
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => { await api.patch('/settings', form); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <Card>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Building2 size={18} className="text-primary" /> Информация о клинике
        </h3>
        <div className="space-y-3">
          <Input label="Название клиники" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-text-secondary mt-[38px]" />
            <div className="flex-1"><Input label="Адрес" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Phone size={18} className="text-primary" /> Контакты
        </h3>
        <div className="space-y-3">
          <Input label="Телефон клиники" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Telegram Chat ID" value={form.ownerTelegramId} onChange={(e) => setForm({ ...form, ownerTelegramId: e.target.value })} />
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-3">Бонусная программа</h3>
        <Input label="Процент начисления бонусов (%)" type="number" value={String(form.bonusPercent)} onChange={(e) => setForm({ ...form, bonusPercent: Number(e.target.value) })} />
      </Card>

      <Button size="lg" loading={mutation.isPending} onClick={() => mutation.mutate()}>
        {saved ? <><Check size={18} /> Сохранено!</> : 'Сохранить настройки'}
      </Button>
    </motion.div>
  );
}

function StaffTab() {
  const queryClient = useQueryClient();
  const { data: staff } = useQuery({
    queryKey: ['owner-staff-mgmt'],
    queryFn: async () => { const { data } = await api.get('/staff'); return data.data; },
  });

  const togglePermission = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      await api.patch(`/staff/${id}`, { [field]: value });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-staff-mgmt'] }),
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {(staff || []).map((s: Record<string, unknown>) => (
        <Card key={s.id as string}>
          <div className="mb-3">
            <p className="font-semibold">{(s.user as Record<string, unknown>)?.name as string}</p>
            <p className="text-sm text-text-secondary">{s.specialty as string}</p>
          </div>
          <div className="space-y-2">
            <PermToggle
              label="Управление услугами"
              checked={s.canManageServices as boolean}
              onChange={(v) => togglePermission.mutate({ id: s.id as string, field: 'canManageServices', value: v })}
            />
            <PermToggle
              label="Управление расписанием"
              checked={s.canManageSchedule as boolean}
              onChange={(v) => togglePermission.mutate({ id: s.id as string, field: 'canManageSchedule', value: v })}
            />
            <PermToggle
              label="Управление акциями"
              checked={s.canManagePromotions as boolean}
              onChange={(v) => togglePermission.mutate({ id: s.id as string, field: 'canManagePromotions', value: v })}
            />
          </div>
        </Card>
      ))}
    </motion.div>
  );
}

function PermToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-border'}`}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
          animate={{ left: checked ? 22 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
