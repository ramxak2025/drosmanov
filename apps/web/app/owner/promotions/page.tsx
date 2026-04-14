'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit3, Camera, Calendar } from 'lucide-react';
import { useRequireAuth } from '@/lib/auth';
import api from '@/lib/api';

export default function PromosPage() {
  useRequireAuth(['OWNER', 'STAFF']);
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', discount: '', startDate: '', endDate: '' });

  const { data: promos } = useQuery({
    queryKey: ['promos-all'],
    queryFn: async () => { const { data } = await api.get('/promotions?all=true'); return data.data; },
  });

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        title: form.title,
        description: form.description || undefined,
        discount: form.discount ? parseFloat(form.discount) : undefined,
        startDate: form.startDate,
        endDate: form.endDate,
      };
      if (editId) await api.patch(`/promotions/${editId}`, body);
      else await api.post('/promotions', body);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promos-all'] }); reset(); },
  });

  const uploadPhoto = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`/promotions/${id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promos-all'] }),
  });

  const reset = () => {
    setShowForm(false); setEditId(null);
    setForm({ title: '', description: '', discount: '', startDate: '', endDate: '' });
  };

  const edit = (p: Record<string, unknown>) => {
    setEditId(p.id as string);
    setForm({
      title: p.title as string,
      description: (p.description as string) || '',
      discount: p.discount ? String(p.discount) : '',
      startDate: (p.startDate as string).split('T')[0],
      endDate: (p.endDate as string).split('T')[0],
    });
    setShowForm(true);
  };

  if (showForm) {
    return (
      <div className="px-6 pt-12 pb-8">
        <button onClick={reset} className="text-sm text-ink-secondary font-medium mb-6">← Назад</button>
        <h1 className="text-h2">{editId ? 'Редактировать' : 'Новая акция'}</h1>

        <div className="mt-8 stack">
          <Field label="Название" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <Field label="Описание" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          <Field label="Скидка (%)" type="number" value={form.discount} onChange={(v) => setForm({ ...form, discount: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Начало" type="date" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
            <Field label="Конец" type="date" value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} />
          </div>
          <button onClick={() => save.mutate()} disabled={!form.title || !form.startDate || !form.endDate}
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
        <h1 className="text-h2">Акции</h1>
        <button onClick={() => { reset(); setShowForm(true); }}
          className="bg-brand text-white w-10 h-10 rounded-md flex items-center justify-center shadow-button
            active:scale-[0.95]">
          <Plus size={20} />
        </button>
      </div>

      {(!promos || promos.length === 0) ? (
        <div className="text-center py-16">
          <p className="text-sm text-ink-tertiary">Нет акций</p>
        </div>
      ) : (
        <div className="stack-md">
          {promos.map((p: Record<string, unknown>) => {
            const expired = new Date(p.endDate as string) < new Date();
            return (
              <div key={p.id as string} className={`bg-bg-card rounded-lg shadow-card overflow-hidden ${expired ? 'opacity-60' : ''}`}>
                <label className="relative h-36 bg-brand-light block cursor-pointer">
                  {p.photoPath ? (
                    <img src={`/api/uploads/${p.photoPath}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera size={28} className="text-brand/30" />
                    </div>
                  )}
                  {p.discount && (
                    <div className="absolute top-3 right-3 bg-status-red text-white text-xs font-extrabold px-2 py-1 rounded-sm">
                      -{p.discount as number}%
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadPhoto.mutate({ id: p.id as string, file: f });
                    }} />
                </label>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-[15px] font-bold">{p.title as string}</h3>
                      {p.description && <p className="text-sm text-ink-secondary mt-2">{p.description as string}</p>}
                      <p className="text-xs text-ink-tertiary mt-3 flex items-center gap-1">
                        <Calendar size={12} />
                        до {new Date(p.endDate as string).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <button onClick={() => edit(p)} className="p-2 text-ink-tertiary active:scale-95">
                      <Edit3 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
