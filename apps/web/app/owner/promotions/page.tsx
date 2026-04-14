'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Edit3, Camera, Tag, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BottomSheet } from '@/components/ui/BottomSheet';
import api from '@/lib/api';

export default function PromotionsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', discount: '', startDate: '', endDate: '',
  });

  const { data: promotions } = useQuery({
    queryKey: ['promotions'],
    queryFn: async () => { const { data } = await api.get('/promotions?all=true'); return data.data; },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        title: form.title,
        description: form.description || undefined,
        discount: form.discount ? parseFloat(form.discount) : undefined,
        startDate: form.startDate,
        endDate: form.endDate,
      };
      if (editId) {
        await api.patch(`/promotions/${editId}`, body);
      } else {
        await api.post('/promotions', body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      resetForm();
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/promotions/${id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promotions'] }),
  });

  const resetForm = () => {
    setShowForm(false); setEditId(null);
    setForm({ title: '', description: '', discount: '', startDate: '', endDate: '' });
  };

  const startEdit = (p: Record<string, unknown>) => {
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

  const isExpired = (endDate: string) => new Date(endDate) < new Date();

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Акции</h1>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={16} /> Создать
        </Button>
      </div>

      {(!promotions || promotions.length === 0) ? (
        <div className="text-center py-16">
          <Tag size={40} className="text-text-secondary/30 mx-auto mb-3" />
          <p className="text-text-secondary">Нет акций</p>
          <p className="text-xs text-text-secondary mt-1">Создайте первую акцию для привлечения клиентов</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promotions.map((p: Record<string, unknown>, i: number) => {
            const expired = isExpired(p.endDate as string);
            return (
              <motion.div key={p.id as string} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={expired ? 'opacity-60' : ''}>
                  {/* Banner photo */}
                  {p.photoPath ? (
                    <div className="relative -mx-4 -mt-4 mb-3 rounded-t-[20px] overflow-hidden h-36">
                      <img src={`/api/uploads/${p.photoPath}`} alt="" className="w-full h-full object-cover" />
                      {p.discount && (
                        <div className="absolute top-3 right-3 bg-error text-white text-xs font-bold px-2 py-1 rounded-xl">
                          -{p.discount as number}%
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="relative -mx-4 -mt-4 mb-3 rounded-t-[20px] overflow-hidden h-28 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center cursor-pointer group">
                      <div className="text-center">
                        <Camera size={24} className="text-text-secondary/40 mx-auto mb-1 group-hover:text-primary transition-colors" />
                        <span className="text-xs text-text-secondary/40 group-hover:text-primary">Добавить фото</span>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadPhotoMutation.mutate({ id: p.id as string, file });
                      }} />
                    </label>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{p.title as string}</h3>
                        {expired && <span className="text-[10px] bg-error/10 text-error px-1.5 py-0.5 rounded-full">Истекла</span>}
                      </div>
                      {p.description && <p className="text-sm text-text-secondary mt-1">{p.description as string}</p>}
                      <div className="flex items-center gap-1 mt-2 text-xs text-text-secondary">
                        <Calendar size={12} />
                        {new Date(p.startDate as string).toLocaleDateString('ru-RU')} — {new Date(p.endDate as string).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    <button onClick={() => startEdit(p)} className="p-2 text-text-secondary hover:text-primary">
                      <Edit3 size={16} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <BottomSheet isOpen={showForm} onClose={resetForm} title={editId ? 'Редактировать акцию' : 'Новая акция'}>
        <div className="space-y-4">
          <Input label="Название" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Скидка на чистку зубов" />
          <Input label="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Подробное описание акции" />
          <Input label="Скидка (%)" type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder="20" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Начало" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="Конец" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <Button size="lg" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()} disabled={!form.title || !form.startDate || !form.endDate}>
            {editId ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
