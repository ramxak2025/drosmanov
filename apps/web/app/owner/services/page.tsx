'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Camera, Package } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BottomSheet } from '@/components/ui/BottomSheet';
import api from '@/lib/api';

const CATEGORIES = ['Терапия', 'Хирургия', 'Гигиена', 'Ортодонтия', 'Имплантация', 'Эстетика'];

export default function OwnerServicesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', duration: '', category: 'Терапия' });

  const { data: services } = useQuery({
    queryKey: ['owner-services'],
    queryFn: async () => { const { data } = await api.get('/services?isActive=true'); return data.data; },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        duration: parseInt(form.duration),
        category: form.category,
      };
      if (editId) {
        await api.patch(`/services/${editId}`, body);
      } else {
        await api.post('/services', body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-services'] });
      resetForm();
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/services/${id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-services'] }),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm({ name: '', description: '', price: '', duration: '', category: 'Терапия' });
  };

  const startEdit = (s: Record<string, unknown>) => {
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

  // Group by category
  const grouped: Record<string, Record<string, unknown>[]> = {};
  (services || []).forEach((s: Record<string, unknown>) => {
    const cat = s.category as string;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  });

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Каталог услуг</h1>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={16} /> Добавить
        </Button>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="mb-6">
          <h2 className="font-semibold mb-2 text-text-secondary text-xs uppercase tracking-wider">{category}</h2>
          <div className="space-y-2">
            {items.map((s, i) => (
              <motion.div key={s.id as string} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card>
                  <div className="flex gap-3">
                    {/* Photo */}
                    <div className="relative w-16 h-16 rounded-xl bg-surface flex-shrink-0 overflow-hidden">
                      {s.photoPath ? (
                        <img src={`/api/uploads/${s.photoPath}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={24} className="text-text-secondary/30" />
                        </div>
                      )}
                      <label className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors cursor-pointer group">
                        <Camera size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadPhotoMutation.mutate({ id: s.id as string, file });
                          }}
                        />
                      </label>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{s.name as string}</p>
                      {s.description && <p className="text-xs text-text-secondary truncate">{s.description as string}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-semibold text-primary">{(s.price as number).toLocaleString('ru')} &#8381;</span>
                        <span className="text-xs text-text-secondary">{s.duration as number} мин</span>
                      </div>
                    </div>
                    {/* Edit */}
                    <button onClick={() => startEdit(s)} className="self-center p-2 text-text-secondary hover:text-primary">
                      <Edit3 size={16} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      ))}

      {/* Create / Edit form */}
      <BottomSheet isOpen={showForm} onClose={resetForm} title={editId ? 'Редактировать услугу' : 'Новая услуга'}>
        <div className="space-y-4">
          <Input label="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Лечение кариеса" />
          <Input label="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Краткое описание" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Цена, \u20BD" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="3000" />
            <Input label="Время, мин" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="60" />
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary mb-2 block">Категория</label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, category: c })}
                  className={`py-2 rounded-xl text-xs font-medium transition-all ${form.category === c ? 'bg-primary text-white' : 'bg-surface text-text-secondary'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <Button size="lg" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()} disabled={!form.name || !form.price || !form.duration}>
            {editId ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
