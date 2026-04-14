'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, Building2, Users, Check } from 'lucide-react';
import { useAuth, useRequireAuth } from '@/lib/auth';
import api from '@/lib/api';

export default function OwnerSettingsPage() {
  useRequireAuth(['OWNER']);
  const { logout } = useAuth();
  const [tab, setTab] = useState<'clinic' | 'staff'>('clinic');

  return (
    <div className="px-6 pt-12 pb-8">
      <h1 className="text-h2">Настройки</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-subtle rounded-md p-1 mt-6">
        <button onClick={() => setTab('clinic')}
          className={`flex-1 py-2.5 rounded-sm text-sm font-semibold flex items-center justify-center gap-1.5 transition-all
            ${tab === 'clinic' ? 'bg-bg-card shadow-soft text-ink' : 'text-ink-secondary'}`}>
          <Building2 size={16} /> Клиника
        </button>
        <button onClick={() => setTab('staff')}
          className={`flex-1 py-2.5 rounded-sm text-sm font-semibold flex items-center justify-center gap-1.5 transition-all
            ${tab === 'staff' ? 'bg-bg-card shadow-soft text-ink' : 'text-ink-secondary'}`}>
          <Users size={16} /> Персонал
        </button>
      </div>

      <div className="mt-6">
        {tab === 'clinic' ? <ClinicTab /> : <StaffTab />}
      </div>

      <button onClick={logout}
        className="w-full mt-10 bg-bg-card rounded-lg shadow-card p-4 flex items-center justify-center gap-3 text-status-red
          active:scale-[0.98] transition-transform">
        <LogOut size={18} />
        <span className="text-sm font-semibold">Выйти</span>
      </button>
    </div>
  );
}

function ClinicTab() {
  const qc = useQueryClient();
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

  const save = useMutation({
    mutationFn: async () => { await api.patch('/settings', form); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <div className="space-y-4">
      <Field label="Название клиники" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
      <Field label="Адрес" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
      <Field label="Телефон" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
      <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
      <Field label="% бонусов" type="number" value={String(form.bonusPercent)} onChange={(v) => setForm({ ...form, bonusPercent: Number(v) })} />
      <Field label="Telegram Chat ID" value={form.ownerTelegramId} onChange={(v) => setForm({ ...form, ownerTelegramId: v })} />
      <button onClick={() => save.mutate()}
        className="w-full bg-brand text-white py-4 rounded-md text-[15px] font-bold shadow-button
          active:scale-[0.97] transition-transform">
        {saved ? <span className="flex items-center justify-center gap-2"><Check size={16} /> Сохранено</span> : 'Сохранить'}
      </button>
    </div>
  );
}

function StaffTab() {
  const qc = useQueryClient();
  const { data: staff } = useQuery({
    queryKey: ['owner-staff'],
    queryFn: async () => { const { data } = await api.get('/staff'); return data.data; },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      await api.patch(`/staff/${id}`, { [field]: value });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-staff'] }),
  });

  return (
    <div className="space-y-3">
      {(staff || []).map((s: Record<string, unknown>) => (
        <div key={s.id as string} className="bg-bg-card rounded-lg shadow-card p-5">
          <p className="text-[15px] font-bold">{(s.user as Record<string, unknown>)?.name as string}</p>
          <p className="text-sm text-brand font-semibold mt-1">{s.specialty as string}</p>

          <div className="mt-4 space-y-3">
            <Toggle label="Управление услугами" checked={s.canManageServices as boolean}
              onChange={(v) => toggle.mutate({ id: s.id as string, field: 'canManageServices', value: v })} />
            <Toggle label="Управление расписанием" checked={s.canManageSchedule as boolean}
              onChange={(v) => toggle.mutate({ id: s.id as string, field: 'canManageSchedule', value: v })} />
            <Toggle label="Управление акциями" checked={s.canManagePromotions as boolean}
              onChange={(v) => toggle.mutate({ id: s.id as string, field: 'canManagePromotions', value: v })} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-[12px] text-ink-secondary font-semibold mb-2 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-[14px] rounded-md bg-bg-card text-[15px] shadow-soft outline-none
          focus:ring-2 focus:ring-brand/20" />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <button onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full relative transition-colors ${checked ? 'bg-brand' : 'bg-ink-disabled/30'}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all
          ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}
