'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit3, Camera, ChevronDown } from 'lucide-react';
import { useRequireAuth } from '@/lib/auth';
import api from '@/lib/api';

const CATEGORIES = ['Терапия', 'Хирургия', 'Гигиена', 'Ортодонтия', 'Имплантация', 'Эстетика'];

export default function OwnerServicesPage() {
  useRequireAuth(['OWNER']);
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', duration: '', category: 'Терапия' });

  const { data: services } = useQuery({
    queryKey: ['owner-services'],
    queryFn: async () => { const { data } = await api.get('/services?isActive=true'); return data.data; },
  });

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        duration: parseInt(form.duration),
        category: form.category,
      };
      if (editId) await api.patch(`/services/${editId}`, body);
      else await api.post('/services', body);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['owner-services'] }); reset(); },
  });

  const uploadPhoto = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`/services/${id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-services'] }),
  });

  const reset = () => {
    setShowForm(false); setEditId(null);
    setForm({ name: '', description: '', price: '', duration: '', category: 'Терапия' });
  };

  const edit = (s: Record<string, unknown>) => {
    setEditId(s.id as string);
    setForm({
      name: s.name as string,
      description: (s.description as string) || '',
      price: String(s.price),
      duration: String(s.duration),
      category: s.category as string,
    });
    setShowForm(true);
  };

  const grouped: Record<string, Record<string, unknown>[]> = {};
  (services || []).forEach((s: Record<string, unknown>) => {
    const c = s.category as string;
    if (!grouped[c]) grouped[c] = [];
    grouped[c].push(s);
  });

  if (showForm) {
    return (
      <div className="px-6 pt-12 pb-8">
        <button onClick={reset} className="text-sm text-ink-secondary font-medium mb-6">← Назад</button>
        <h1 className="text-h2">{editId ? 'Редактировать услугу' : 'Новая услуга'}</h1>

        <div className="mt-8 stack">
          {/* Фото услуги */}
          {editId && (
            <div>
              <label className="text-[12px] text-ink-secondary font-semibold mb-2 block">Фото услуги</label>
              <label className="relative block h-[120px] rounded-lg overflow-hidden cursor-pointer
                active:scale-[0.99] transition-transform border-2 border-dashed border-line hover:border-brand/40">
                {(() => {
                  const svc = (services || []).find((s: Record<string, unknown>) => s.id === editId);
                  return svc?.photoPath ? (
                    <img src={`/api/uploads/${svc.photoPath}`} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-bg-card flex flex-col items-center justify-center gap-2">
                      <Camera size={24} className="text-ink-disabled" />
                      <p className="text-[12px] text-ink-tertiary">Нажмите для загрузки (800×600, WebP)</p>
                    </div>
                  );
                })()}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && editId) uploadPhoto.mutate({ id: editId, file: f });
                  }} />
              </label>
              {uploadPhoto.isPending && <p className="text-[12px] text-brand font-semibold mt-1">Загрузка...</p>}
            </div>
          )}

          <Field label="Название" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Описание" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Цена, ₽" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
            <Field label="Время, мин" type="number" value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} />
          </div>
          <div>
            <label className="text-[12px] text-ink-secondary font-semibold mb-2 block">Категория</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, category: c })}
                  className={`py-[10px] rounded-sm text-[12px] font-semibold
                    ${form.category === c ? 'bg-brand text-white' : 'bg-bg-card shadow-soft text-ink-secondary'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => save.mutate()} disabled={!form.name || !form.price || !form.duration || save.isPending}
            className="w-full bg-brand text-white py-4 rounded-md text-[15px] font-bold shadow-button
              active:scale-[0.97] transition-transform disabled:opacity-40">
            {save.isPending ? 'Сохранение...' : editId ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-12 pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h2">Услуги</h1>
        <button onClick={() => { reset(); setShowForm(true); }}
          className="bg-brand text-white w-10 h-10 rounded-md flex items-center justify-center shadow-button
            active:scale-[0.95] transition-transform">
          <Plus size={20} />
        </button>
      </div>

      <div className="stack-sm">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <button onClick={() => setOpenCat(openCat === cat ? null : cat)}
              className="w-full bg-bg-card rounded-lg shadow-card p-5 flex items-center justify-between
                active:scale-[0.99] transition-transform">
              <div className="text-left">
                <p className="text-[15px] font-bold">{cat}</p>
                <p className="text-sm text-ink-tertiary mt-0.5">{items.length} услуг</p>
              </div>
              <ChevronDown size={18}
                className={`text-ink-tertiary transition-transform ${openCat === cat ? 'rotate-180' : ''}`} />
            </button>

            {openCat === cat && (
              <div className="mt-2 stack-sm">
                {items.map((s) => (
                  <div key={s.id as string} className="bg-bg-card rounded-md shadow-soft p-4 flex items-center gap-3">
                    <label className="relative w-12 h-12 rounded-md bg-brand-subtle overflow-hidden flex-shrink-0 cursor-pointer">
                      {s.photoPath ? (
                        <img src={`/api/uploads/${s.photoPath}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera size={16} className="text-brand/40" />
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadPhoto.mutate({ id: s.id as string, file: f });
                        }} />
                    </label>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{s.name as string}</p>
                      <p className="text-xs text-brand font-bold mt-1">
                        {(s.price as number).toLocaleString('ru')} ₽ · {s.duration as number} мин
                      </p>
                    </div>
                    <button onClick={() => edit(s)} className="p-2 text-ink-tertiary active:scale-95">
                      <Edit3 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
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
