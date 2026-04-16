'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, Building2, Users, Check, Phone as PhoneIcon, Share2, Camera, ImageIcon } from 'lucide-react';
import { useAuth, useRequireAuth } from '@/lib/auth';
import api from '@/lib/api';

type Tab = 'clinic' | 'contacts' | 'social' | 'staff';

export default function OwnerSettingsPage() {
  useRequireAuth(['OWNER']);
  const { logout } = useAuth();
  const [tab, setTab] = useState<Tab>('clinic');

  return (
    <div className="px-6 pt-12 pb-8">
      <h1 className="text-h2">Настройки</h1>

      <div className="grid grid-cols-2 gap-1 bg-brand-subtle rounded-md p-1 mt-6">
        <TabBtn k="clinic" current={tab} onClick={setTab} icon={Building2}>Клиника</TabBtn>
        <TabBtn k="contacts" current={tab} onClick={setTab} icon={PhoneIcon}>Контакты</TabBtn>
        <TabBtn k="social" current={tab} onClick={setTab} icon={Share2}>Соцсети</TabBtn>
        <TabBtn k="staff" current={tab} onClick={setTab} icon={Users}>Персонал</TabBtn>
      </div>

      <div className="mt-6">
        {tab === 'clinic' && <ClinicTab />}
        {tab === 'contacts' && <ContactsTab />}
        {tab === 'social' && <SocialTab />}
        {tab === 'staff' && <StaffTab />}
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

function TabBtn({ k, current, onClick, icon: Icon, children }: {
  k: Tab; current: Tab; onClick: (k: Tab) => void; icon: React.ElementType; children: React.ReactNode;
}) {
  const active = current === k;
  return (
    <button onClick={() => onClick(k)}
      className={`py-2.5 rounded-sm text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all
        ${active ? 'bg-bg-card shadow-soft text-ink' : 'text-ink-secondary'}`}>
      <Icon size={14} /> {children}
    </button>
  );
}

/* ══ Клиника ══ */
function ClinicTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', bonusPercent: 5, ownerTelegramId: '' });
  const [saved, setSaved] = useState(false);

  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => { const { data } = await api.get('/settings'); return data.data; },
  });

  useEffect(() => {
    if (data) setForm({
      name: data.name || '',
      bonusPercent: data.bonusPercent || 5,
      ownerTelegramId: data.ownerTelegramId || '',
    });
  }, [data]);

  const save = useMutation({
    mutationFn: async () => { await api.patch('/settings', form); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const uploadHero = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      await api.post('/settings/hero', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });

  return (
    <div className="stack">
      {/* Hero картинка */}
      <div>
        <label className="text-[12px] text-ink-secondary font-semibold mb-2 block">Фото для главной (Hero)</label>
        <label className="relative block h-[160px] rounded-lg overflow-hidden cursor-pointer
          active:scale-[0.99] transition-transform border-2 border-dashed border-line hover:border-brand/40">
          {data?.heroImagePath ? (
            <img src={`/api/uploads/${data.heroImagePath}`} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-bg-card flex flex-col items-center justify-center gap-2">
              <ImageIcon size={32} className="text-ink-disabled" />
              <p className="text-[13px] text-ink-tertiary font-semibold">Нажмите для загрузки</p>
              <p className="text-[11px] text-ink-disabled">1600×900, до 10 МБ</p>
            </div>
          )}
          {data?.heroImagePath && (
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="bg-white/90 px-4 py-2 rounded-md flex items-center gap-2">
                <Camera size={14} className="text-ink" />
                <span className="text-[13px] font-semibold text-ink">Заменить</span>
              </div>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadHero.mutate(f); }} />
        </label>
        {uploadHero.isPending && <p className="text-[12px] text-brand font-semibold mt-2">Загрузка...</p>}
        <p className="text-[11px] text-ink-tertiary mt-1.5">Автоматически конвертируется в WebP (1600×900)</p>
      </div>

      <Field label="Название клиники" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
      <Field label="% бонусов (на будущее)" type="number" value={String(form.bonusPercent)} onChange={(v) => setForm({ ...form, bonusPercent: Number(v) })} />
      <Field label="Telegram Chat ID владельца" value={form.ownerTelegramId} onChange={(v) => setForm({ ...form, ownerTelegramId: v })} hint="Для получения уведомлений" />
      <SaveBtn onClick={() => save.mutate()} saved={saved} loading={save.isPending} />
    </div>
  );
}

/* ══ Контакты ══ */
function ContactsTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    address: '', phone: '', email: '', workHours: '',
    mapLat: 42.9849, mapLng: 47.5049,
  });
  const [saved, setSaved] = useState(false);

  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => { const { data } = await api.get('/settings'); return data.data; },
  });

  useEffect(() => {
    if (data) setForm({
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      workHours: data.workHours || '',
      mapLat: data.mapLat || 42.9849,
      mapLng: data.mapLng || 47.5049,
    });
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
    <div className="stack">
      <Field label="Адрес клиники" value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="г. Махачкала, ул. Ярагского, 45" />
      <Field label="Телефон" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+7 (8722) 12-34-56" />
      <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="info@drosmanov.ru" />
      <Field label="Режим работы" value={form.workHours} onChange={(v) => setForm({ ...form, workHours: v })} placeholder="Пн–Пт 9:00–19:00 · Сб 10:00–14:00" />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Широта (карта)" type="number" value={String(form.mapLat)} onChange={(v) => setForm({ ...form, mapLat: Number(v) })} hint="Для Яндекс карты" />
        <Field label="Долгота (карта)" type="number" value={String(form.mapLng)} onChange={(v) => setForm({ ...form, mapLng: Number(v) })} />
      </div>

      <SaveBtn onClick={() => save.mutate()} saved={saved} loading={save.isPending} />
    </div>
  );
}

/* ══ Соцсети ══ */
function SocialTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    whatsapp: '', telegram: '', vk: '', youtube: '', instagram: '', facebook: '',
  });
  const [saved, setSaved] = useState(false);

  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => { const { data } = await api.get('/settings'); return data.data; },
  });

  useEffect(() => {
    if (data) setForm({
      whatsapp: data.whatsapp || '',
      telegram: data.telegram || '',
      vk: data.vk || '',
      youtube: data.youtube || '',
      instagram: data.instagram || '',
      facebook: data.facebook || '',
    });
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
    <div className="stack">
      <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} placeholder="https://wa.me/79001234567" />
      <Field label="Telegram" value={form.telegram} onChange={(v) => setForm({ ...form, telegram: v })} placeholder="https://t.me/username" />
      <Field label="ВКонтакте" value={form.vk} onChange={(v) => setForm({ ...form, vk: v })} placeholder="https://vk.com/username" />
      <Field label="YouTube" value={form.youtube} onChange={(v) => setForm({ ...form, youtube: v })} placeholder="https://youtube.com/@channel" />
      <Field label="Instagram" value={form.instagram} onChange={(v) => setForm({ ...form, instagram: v })} placeholder="https://instagram.com/username" hint="Meta признана экстремистской в РФ" />
      <Field label="Facebook" value={form.facebook} onChange={(v) => setForm({ ...form, facebook: v })} placeholder="https://facebook.com/page" />
      <SaveBtn onClick={() => save.mutate()} saved={saved} loading={save.isPending} />
    </div>
  );
}

/* ══ Персонал (права) ══ */
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
    <div className="stack-sm">
      {(staff || []).map((s: Record<string, unknown>) => (
        <div key={s.id as string} className="bg-bg-card rounded-lg shadow-card p-5">
          <p className="text-[15px] font-bold">{(s.user as Record<string, unknown>)?.name as string}</p>
          <p className="text-sm text-brand font-semibold mt-1">{s.specialty as string}</p>

          <div className="mt-4 stack-sm">
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

/* ── Компоненты ── */

function Field({ label, value, onChange, type = 'text', placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <label className="text-[12px] text-ink-secondary font-semibold mb-2 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-[14px] rounded-md bg-bg-card text-[15px] shadow-soft outline-none
          focus:ring-2 focus:ring-brand/20 placeholder:text-ink-disabled" />
      {hint && <p className="text-[11px] text-ink-tertiary mt-1.5">{hint}</p>}
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

function SaveBtn({ onClick, saved, loading }: { onClick: () => void; saved: boolean; loading: boolean }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="w-full bg-brand text-white py-4 rounded-md text-[15px] font-bold shadow-button
        active:scale-[0.97] transition-transform disabled:opacity-40">
      {saved ? <span className="flex items-center justify-center gap-2"><Check size={16} /> Сохранено</span> :
        loading ? 'Сохранение...' : 'Сохранить'}
    </button>
  );
}
