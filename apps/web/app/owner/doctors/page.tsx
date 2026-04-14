'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit3, Camera, User } from 'lucide-react';
import { useRequireAuth } from '@/lib/auth';
import api from '@/lib/api';

const DAYS = [
  { k: 'mon', l: 'Пн' }, { k: 'tue', l: 'Вт' }, { k: 'wed', l: 'Ср' },
  { k: 'thu', l: 'Чт' }, { k: 'fri', l: 'Пт' }, { k: 'sat', l: 'Сб' }, { k: 'sun', l: 'Вс' },
];

type Schedule = Record<string, { start: string; end: string } | null>;
const emptySchedule: Schedule = { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null };

export default function OwnerDoctorsPage() {
  useRequireAuth(['OWNER']);
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    phone: '', password: '', name: '', specialty: '', bio: '',
    schedule: emptySchedule as Schedule,
  });

  const { data: staff } = useQuery({
    queryKey: ['owner-doctors'],
    queryFn: async () => { const { data } = await api.get('/staff'); return data.data; },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editId) {
        const body: Record<string, unknown> = {
          specialty: form.specialty,
          bio: form.bio || undefined,
          workSchedule: form.schedule,
        };
        if (form.name) body.name = form.name;
        await api.patch(`/staff/${editId}`, body);
      } else {
        await api.post('/staff', {
          phone: form.phone,
          password: form.password,
          name: form.name,
          specialty: form.specialty,
          bio: form.bio || undefined,
          workSchedule: form.schedule,
        });
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['owner-doctors'] }); reset(); },
  });

  const uploadPhoto = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`/staff/${id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-doctors'] }),
  });

  const reset = () => {
    setShowForm(false); setEditId(null);
    setForm({ phone: '', password: '', name: '', specialty: '', bio: '', schedule: emptySchedule });
  };

  const edit = (s: Record<string, unknown>) => {
    setEditId(s.id as string);
    setForm({
      phone: (s.user as Record<string, unknown>)?.phone as string || '',
      password: '',
      name: (s.user as Record<string, unknown>)?.name as string || '',
      specialty: s.specialty as string,
      bio: (s.bio as string) || '',
      schedule: (s.workSchedule as Schedule) || emptySchedule,
    });
    setShowForm(true);
  };

  const toggleDay = (day: string) => {
    const cur = form.schedule[day];
    setForm({
      ...form,
      schedule: { ...form.schedule, [day]: cur ? null : { start: '09:00', end: '18:00' } },
    });
  };

  const setDayTime = (day: string, field: 'start' | 'end', value: string) => {
    const cur = form.schedule[day] || { start: '09:00', end: '18:00' };
    setForm({
      ...form,
      schedule: { ...form.schedule, [day]: { ...cur, [field]: value } },
    });
  };

  /* ═══ Форма ═══ */
  if (showForm) {
    return (
      <div className="px-6 pt-12 pb-8">
        <button onClick={reset} className="text-sm text-ink-secondary font-medium mb-6">← Назад</button>
        <h1 className="text-h2">{editId ? 'Редактировать врача' : 'Новый врач'}</h1>

        <div className="mt-8 stack">
          {!editId && (
            <>
              <Field label="Телефон" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+79001234567" />
              <Field label="Пароль" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="Минимум 4 символа" />
            </>
          )}
          <Field label="ФИО" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Иванова Анна Сергеевна" />
          <Field label="Специальность" value={form.specialty} onChange={(v) => setForm({ ...form, specialty: v })} placeholder="Терапевт" />
          <div>
            <label className="text-[12px] text-ink-secondary font-semibold mb-2 block">Биография</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3}
              placeholder="Стаж, специализация, достижения"
              className="w-full px-4 py-3 rounded-md bg-bg-card text-[15px] shadow-soft outline-none
                focus:ring-2 focus:ring-brand/20 resize-none" />
          </div>

          {/* Расписание */}
          <div>
            <label className="text-[12px] text-ink-secondary font-semibold mb-3 block">Расписание</label>
            <div className="stack-sm">
              {DAYS.map(({ k, l }) => {
                const d = form.schedule[k];
                return (
                  <div key={k} className="bg-bg-card rounded-md shadow-soft p-3 flex items-center gap-3">
                    <button onClick={() => toggleDay(k)}
                      className={`w-12 h-10 rounded-sm flex items-center justify-center text-sm font-bold transition-colors
                        ${d ? 'bg-brand text-white' : 'bg-brand-subtle text-ink-tertiary'}`}>
                      {l}
                    </button>
                    {d && (
                      <>
                        <input type="time" value={d.start} onChange={(e) => setDayTime(k, 'start', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-sm bg-white text-[14px] outline-none border border-line" />
                        <span className="text-ink-tertiary">–</span>
                        <input type="time" value={d.end} onChange={(e) => setDayTime(k, 'end', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-sm bg-white text-[14px] outline-none border border-line" />
                      </>
                    )}
                    {!d && <span className="text-sm text-ink-tertiary">Выходной</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={() => save.mutate()}
            disabled={!form.name || !form.specialty || (!editId && (form.phone.length !== 12 || form.password.length < 4))}
            className="w-full bg-brand text-white py-4 rounded-md text-[15px] font-bold shadow-button
              active:scale-[0.97] transition-transform disabled:opacity-40 mt-4">
            {save.isPending ? 'Сохранение...' : editId ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    );
  }

  /* ═══ Список ═══ */
  return (
    <div className="px-6 pt-12 pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h2">Врачи</h1>
        <button onClick={() => { reset(); setShowForm(true); }}
          className="bg-brand text-white w-10 h-10 rounded-md flex items-center justify-center shadow-button
            active:scale-[0.95]">
          <Plus size={20} />
        </button>
      </div>

      <div className="stack-lg">
        {(staff || []).map((s: Record<string, unknown>) => {
          const name = (s.user as Record<string, unknown>)?.name as string || '';
          const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2);
          return (
            <div key={s.id as string} className="bg-bg-card rounded-lg shadow-card overflow-hidden">
              <div className="flex">
                {/* Вертикальное фото 3:4 */}
                <label className="relative w-[120px] h-[160px] bg-brand-light flex-shrink-0 cursor-pointer group">
                  {s.photoPath ? (
                    <img src={`/api/uploads/${s.photoPath}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={32} className="text-brand/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors
                    flex items-center justify-center">
                    <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadPhoto.mutate({ id: s.id as string, file: f });
                    }} />
                </label>

                {/* Информация */}
                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold leading-snug">{name || initials}</p>
                        <p className="text-sm text-brand font-semibold mt-1">{s.specialty as string}</p>
                      </div>
                      <button onClick={() => edit(s)} className="p-1 text-ink-tertiary active:scale-95">
                        <Edit3 size={16} />
                      </button>
                    </div>
                    {s.bio && <p className="text-xs text-ink-secondary mt-2 line-clamp-2">{s.bio as string}</p>}
                  </div>
                  <span className={`text-[10px] px-2 py-[3px] rounded-full self-start mt-2 font-semibold
                    ${s.isActive ? 'bg-status-green/10 text-status-green' : 'bg-status-red/10 text-status-red'}`}>
                    {s.isActive ? 'Активен' : 'Не активен'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[12px] text-ink-secondary font-semibold mb-2 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-[14px] rounded-md bg-bg-card text-[15px] shadow-soft outline-none
          focus:ring-2 focus:ring-brand/20 placeholder:text-ink-disabled" />
    </div>
  );
}
