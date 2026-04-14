'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, Phone, Calendar, AlertTriangle, Plus, FileText, Upload, X,
} from 'lucide-react';
import { useRequireAuth } from '@/lib/auth';
import api from '@/lib/api';

export default function PatientPage() {
  useRequireAuth(['STAFF', 'OWNER']);
  const { id } = useParams();
  const router = useRouter();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ diagnosis: '', treatment: '', notes: '' });

  const { data: patient } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => { const { data } = await api.get(`/patients/${id}`); return data.data; },
  });

  const { data: records } = useQuery({
    queryKey: ['med-records', id],
    queryFn: async () => { const { data } = await api.get(`/med-records?clientId=${id}`); return data.data; },
    enabled: !!id,
  });

  const createRecord = useMutation({
    mutationFn: async () => {
      await api.post('/med-records', {
        clientId: id,
        diagnosis: form.diagnosis,
        treatment: form.treatment,
        notes: form.notes || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['med-records', id] });
      setShowForm(false);
      setForm({ diagnosis: '', treatment: '', notes: '' });
    },
  });

  const uploadDoc = useMutation({
    mutationFn: async ({ recordId, file }: { recordId: string; file: File }) => {
      const fd = new FormData();
      fd.append('file', file);
      await api.post('/documents/upload', fd, {
        params: { clientId: id as string, medRecordId: recordId, type: 'XRAY' },
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['med-records', id] }),
  });

  if (!patient) {
    return <div className="px-6 pt-12"><p className="text-ink-tertiary">Загрузка...</p></div>;
  }

  return (
    <div className="px-6 pt-6 pb-8">
      <button onClick={() => router.back()}
        className="w-10 h-10 rounded-full bg-bg-card shadow-soft flex items-center justify-center active:scale-95 mb-4">
        <ChevronLeft size={18} />
      </button>

      <div className="bg-bg-card rounded-lg shadow-card p-6">
        <h1 className="text-h3">{(patient.user as Record<string, unknown>)?.name as string}</h1>
        <p className="text-sm text-ink-secondary mt-1 flex items-center gap-1">
          <Phone size={13} /> {(patient.user as Record<string, unknown>)?.phone as string}
        </p>
        {patient.birthDate && (
          <p className="text-sm text-ink-secondary mt-1 flex items-center gap-1">
            <Calendar size={13} /> {new Date(patient.birthDate).toLocaleDateString('ru-RU')}
          </p>
        )}
        {patient.allergyNotes && (
          <div className="mt-3 bg-status-red/10 rounded-md p-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-status-red flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-status-red font-semibold">{patient.allergyNotes}</p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-bold text-ink-secondary uppercase tracking-wider mb-4">Визиты</h2>
        {!patient.appointments || patient.appointments.length === 0 ? (
          <p className="text-sm text-ink-tertiary">Нет визитов</p>
        ) : (
          <div className="stack-sm">
            {(patient.appointments as Record<string, unknown>[]).map((apt) => (
              <div key={apt.id as string} className="bg-bg-card rounded-md shadow-soft p-4">
                <p className="text-sm font-semibold">{(apt.service as Record<string, unknown>)?.name as string}</p>
                <p className="text-[12px] text-ink-tertiary mt-1">
                  {new Date(apt.startTime as string).toLocaleDateString('ru-RU', {
                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-ink-secondary uppercase tracking-wider">Заключения</h2>
          <button onClick={() => setShowForm(true)}
            className="bg-brand text-white w-9 h-9 rounded-md flex items-center justify-center shadow-button
              active:scale-[0.95]">
            <Plus size={16} />
          </button>
        </div>

        {(!records || records.length === 0) ? (
          <p className="text-sm text-ink-tertiary">Нет заключений</p>
        ) : (
          <div className="stack">
            {records.map((r: Record<string, unknown>) => (
              <div key={r.id as string} className="bg-bg-card rounded-lg shadow-card p-5">
                <p className="text-[12px] text-ink-tertiary mb-3">
                  {new Date(r.date as string).toLocaleDateString('ru-RU', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                  {' · '}
                  {((r.staff as Record<string, unknown>)?.user as Record<string, unknown>)?.name as string}
                </p>
                <div className="stack-sm">
                  <div>
                    <p className="text-[11px] text-ink-tertiary font-semibold">Диагноз</p>
                    <p className="text-sm font-semibold mt-1">{r.diagnosis as string}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-ink-tertiary font-semibold">Лечение</p>
                    <p className="text-sm mt-1">{r.treatment as string}</p>
                  </div>
                  {r.notes ? (
                    <div>
                      <p className="text-[11px] text-ink-tertiary font-semibold">Рекомендации</p>
                      <p className="text-sm mt-1">{String(r.notes)}</p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 pt-4 border-t border-line">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] text-ink-tertiary font-semibold">Снимки и документы</p>
                    <label className="text-xs text-brand font-semibold flex items-center gap-1 cursor-pointer active:scale-95">
                      <Upload size={12} /> Загрузить
                      <input type="file" accept="image/*,application/pdf" className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadDoc.mutate({ recordId: r.id as string, file: f });
                        }} />
                    </label>
                  </div>
                  {((r.documents as Record<string, unknown>[]) || []).length === 0 ? (
                    <p className="text-[12px] text-ink-disabled">Нет файлов</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {(r.documents as Record<string, unknown>[]).map((d) => (
                        <a key={d.id as string} href={`/api/documents/${d.id}/download`} target="_blank" rel="noreferrer"
                          className="aspect-square bg-brand-subtle rounded-md flex items-center justify-center
                            active:scale-95 transition-transform">
                          <FileText size={20} className="text-brand-dark" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модалка добавления заключения */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-page mx-auto bg-bg rounded-t-xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 pt-6 pb-2">
              <div className="w-10" />
              <div className="w-10 h-1 bg-line-strong rounded-full" />
              <button onClick={() => setShowForm(false)}
                className="w-10 h-10 rounded-full bg-bg-card shadow-soft flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 pb-8">
              <h2 className="text-h3 mb-6">Новое заключение</h2>
              <div className="stack">
                <Textarea label="Диагноз" value={form.diagnosis} onChange={(v) => setForm({ ...form, diagnosis: v })}
                  placeholder="Напр.: Кариес 36 зуба" rows={2} />
                <Textarea label="Лечение" value={form.treatment} onChange={(v) => setForm({ ...form, treatment: v })}
                  placeholder="Описание проведённого лечения" rows={3} />
                <Textarea label="Рекомендации" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })}
                  placeholder="Рекомендации пациенту" rows={2} />
              </div>
              <button onClick={() => createRecord.mutate()}
                disabled={!form.diagnosis || !form.treatment || createRecord.isPending}
                className="w-full mt-6 bg-brand text-white py-4 rounded-md text-[15px] font-bold shadow-button
                  active:scale-[0.97] transition-transform disabled:opacity-40">
                {createRecord.isPending ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 2 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label className="text-[12px] text-ink-secondary font-semibold mb-2 block">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full px-4 py-3 rounded-md bg-bg-card text-[15px] shadow-soft outline-none
          focus:ring-2 focus:ring-brand/20 resize-none placeholder:text-ink-disabled" />
    </div>
  );
}
