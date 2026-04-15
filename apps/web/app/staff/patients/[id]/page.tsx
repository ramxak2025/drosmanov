'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, Phone, Calendar, AlertTriangle, Plus, FileText, Upload, X,
  CalendarPlus, Clock, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useRequireAuth } from '@/lib/auth';
import api from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает', CONFIRMED: 'Подтверждена', IN_PROGRESS: 'Идёт',
  COMPLETED: 'Завершена', CANCELLED: 'Отменена', NO_SHOW: 'Неявка',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-brand-subtle text-brand-dark',
  CONFIRMED: 'bg-status-green/10 text-status-green',
  IN_PROGRESS: 'bg-brand/15 text-brand',
  COMPLETED: 'bg-ink-disabled/20 text-ink-secondary',
  CANCELLED: 'bg-status-red/10 text-status-red',
  NO_SHOW: 'bg-status-red/10 text-status-red',
};

export default function PatientPage() {
  useRequireAuth(['STAFF', 'OWNER']);
  const { id } = useParams();
  const router = useRouter();
  const qc = useQueryClient();

  const [openVisit, setOpenVisit] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [recordForm, setRecordForm] = useState<Record<string, { diagnosis: string; treatment: string; notes: string }>>({});

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
    mutationFn: async ({ aptId, data }: { aptId: string; data: { diagnosis: string; treatment: string; notes?: string } }) => {
      await api.post('/med-records', { clientId: id, ...data });
      // Также помечаем визит как завершённый если ещё не завершён
      try {
        await api.patch(`/appointments/${aptId}/status`, { status: 'COMPLETED' });
      } catch { /* может быть уже завершён */ }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['med-records', id] });
      qc.invalidateQueries({ queryKey: ['patient', id] });
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

  const appointments = (patient.appointments as Record<string, unknown>[]) || [];
  // Сортируем: сначала будущие/активные, потом завершённые (обратно по дате)
  const sorted = [...appointments].sort((a, b) => {
    return new Date(b.startTime as string).getTime() - new Date(a.startTime as string).getTime();
  });

  // Связываем визит с мед. записью по дате
  const recordByApt = (apt: Record<string, unknown>) => {
    const d = new Date(apt.startTime as string).toISOString().split('T')[0];
    return (records || []).find((r: Record<string, unknown>) => {
      const rd = new Date(r.date as string).toISOString().split('T')[0];
      return rd === d;
    });
  };

  return (
    <div className="px-6 pt-6 pb-8">
      <button onClick={() => router.back()}
        className="w-10 h-10 rounded-full bg-bg-card shadow-soft flex items-center justify-center active:scale-95 mb-4">
        <ChevronLeft size={18} />
      </button>

      {/* Шапка пациента */}
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

      {/* Кнопка "Записать" */}
      <button onClick={() => setShowBookingForm(true)}
        className="w-full mt-4 bg-brand text-white py-3 rounded-md text-[14px] font-bold shadow-button
          active:scale-[0.97] transition-transform flex items-center justify-center gap-2">
        <CalendarPlus size={16} /> Записать на приём
      </button>

      {/* История визитов — карточками */}
      <div className="mt-8">
        <h2 className="text-sm font-bold text-ink-secondary uppercase tracking-wider mb-4">
          История визитов · {appointments.length}
        </h2>

        {sorted.length === 0 ? (
          <p className="text-sm text-ink-tertiary">Визитов пока нет</p>
        ) : (
          <div className="stack">
            {sorted.map((apt) => {
              const isOpen = openVisit === apt.id;
              const record = recordByApt(apt);
              const status = apt.status as string;
              const isFuture = new Date(apt.startTime as string) > new Date() && ['PENDING', 'CONFIRMED'].includes(status);

              const aptForm = recordForm[apt.id as string] || { diagnosis: '', treatment: '', notes: '' };

              return (
                <div key={apt.id as string} className="bg-bg-card rounded-lg shadow-card overflow-hidden">
                  {/* Заголовок визита */}
                  <button onClick={() => setOpenVisit(isOpen ? null : (apt.id as string))}
                    className="w-full px-5 py-4 flex items-start gap-3 text-left active:scale-[0.99] transition-transform">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0
                      ${isFuture ? 'bg-brand text-white' : 'bg-brand-subtle text-brand-dark'}`}>
                      {isFuture ? <CalendarPlus size={18} /> : <Clock size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-bold">{(apt.service as Record<string, unknown>)?.name as string}</p>
                        <span className={`text-[10px] font-semibold px-2 py-[2px] rounded-full ${STATUS_COLORS[status]}`}>
                          {STATUS_LABELS[status]}
                        </span>
                      </div>
                      <p className="text-[12px] text-ink-tertiary mt-1">
                        {new Date(apt.startTime as string).toLocaleDateString('ru-RU', {
                          day: 'numeric', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                      {record && (
                        <p className="text-[11px] text-brand font-semibold mt-1">
                          ✓ Есть заключение
                        </p>
                      )}
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-ink-tertiary mt-2" /> : <ChevronDown size={16} className="text-ink-tertiary mt-2" />}
                  </button>

                  {/* Раскрытая часть */}
                  {isOpen && (
                    <div className="border-t border-line px-5 py-5 stack">
                      {/* Существующее заключение */}
                      {record && (
                        <div className="bg-brand-subtle/50 rounded-md p-4 stack-sm">
                          <div>
                            <p className="text-[10px] text-ink-tertiary font-bold uppercase tracking-wider">Диагноз</p>
                            <p className="text-[13px] font-semibold mt-1">{record.diagnosis as string}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-ink-tertiary font-bold uppercase tracking-wider">Лечение</p>
                            <p className="text-[13px] mt-1">{record.treatment as string}</p>
                          </div>
                          {record.notes ? (
                            <div>
                              <p className="text-[10px] text-ink-tertiary font-bold uppercase tracking-wider">Рекомендации</p>
                              <p className="text-[13px] mt-1">{String(record.notes)}</p>
                            </div>
                          ) : null}

                          {/* Снимки */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[10px] text-ink-tertiary font-bold uppercase tracking-wider">Снимки</p>
                              <label className="text-[11px] text-brand font-bold flex items-center gap-1 cursor-pointer active:scale-95">
                                <Upload size={11} /> Добавить
                                <input type="file" accept="image/*,application/pdf" className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) uploadDoc.mutate({ recordId: record.id as string, file: f });
                                  }} />
                              </label>
                            </div>
                            {((record.documents as Record<string, unknown>[]) || []).length === 0 ? (
                              <p className="text-[11px] text-ink-disabled">Снимков нет</p>
                            ) : (
                              <div className="grid grid-cols-4 gap-2">
                                {(record.documents as Record<string, unknown>[]).map((d) => (
                                  <a key={d.id as string} href={`/api/documents/${d.id}/download`} target="_blank" rel="noreferrer"
                                    className="aspect-square bg-white rounded-sm flex items-center justify-center
                                      shadow-soft active:scale-95 transition-transform">
                                    <FileText size={16} className="text-brand-dark" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Форма добавления заключения (если ещё нет) */}
                      {!record && status !== 'CANCELLED' && (
                        <div className="stack-sm">
                          <p className="text-[11px] text-ink-tertiary font-bold uppercase tracking-wider">Добавить заключение</p>
                          <textarea value={aptForm.diagnosis}
                            onChange={(e) => setRecordForm({ ...recordForm, [apt.id as string]: { ...aptForm, diagnosis: e.target.value } })}
                            placeholder="Диагноз" rows={2}
                            className="w-full px-4 py-3 rounded-md bg-white text-[14px] shadow-soft outline-none
                              focus:ring-2 focus:ring-brand/20 resize-none placeholder:text-ink-disabled" />
                          <textarea value={aptForm.treatment}
                            onChange={(e) => setRecordForm({ ...recordForm, [apt.id as string]: { ...aptForm, treatment: e.target.value } })}
                            placeholder="Проведённое лечение" rows={3}
                            className="w-full px-4 py-3 rounded-md bg-white text-[14px] shadow-soft outline-none
                              focus:ring-2 focus:ring-brand/20 resize-none placeholder:text-ink-disabled" />
                          <textarea value={aptForm.notes}
                            onChange={(e) => setRecordForm({ ...recordForm, [apt.id as string]: { ...aptForm, notes: e.target.value } })}
                            placeholder="Рекомендации" rows={2}
                            className="w-full px-4 py-3 rounded-md bg-white text-[14px] shadow-soft outline-none
                              focus:ring-2 focus:ring-brand/20 resize-none placeholder:text-ink-disabled" />
                          <button
                            onClick={() => createRecord.mutate({
                              aptId: apt.id as string,
                              data: { diagnosis: aptForm.diagnosis, treatment: aptForm.treatment, notes: aptForm.notes || undefined },
                            })}
                            disabled={!aptForm.diagnosis || !aptForm.treatment || createRecord.isPending}
                            className="w-full bg-brand text-white py-3 rounded-md text-[13px] font-bold shadow-button
                              active:scale-[0.97] transition-transform disabled:opacity-40">
                            {createRecord.isPending ? 'Сохранение...' : 'Сохранить заключение'}
                          </button>
                        </div>
                      )}

                      {/* Быстрая запись на повторный визит */}
                      <button onClick={() => setShowBookingForm(true)}
                        className="w-full bg-bg rounded-md p-3 text-[13px] text-brand font-semibold
                          flex items-center justify-center gap-2 active:scale-[0.97] border border-line">
                        <CalendarPlus size={14} /> Записать на следующий приём
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Модалка записи на следующий приём */}
      {showBookingForm && (
        <BookingModal
          clientId={id as string}
          onClose={() => setShowBookingForm(false)}
          onSuccess={() => {
            setShowBookingForm(false);
            qc.invalidateQueries({ queryKey: ['patient', id] });
          }}
        />
      )}
    </div>
  );
}

/* ══ Модалка записи на следующий приём ══ */
function BookingModal({ clientId, onClose, onSuccess }: {
  clientId: string; onClose: () => void; onSuccess: () => void;
}) {
  const [serviceId, setServiceId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<{ start: string; end: string } | null>(null);

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => { const { data } = await api.get('/services'); return data.data; },
  });
  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => { const { data } = await api.get('/staff'); return data.data; },
  });
  const { data: slots } = useQuery({
    queryKey: ['slots', staffId, date, serviceId],
    queryFn: async () => {
      const { data } = await api.get('/appointments/slots', { params: { staffId, date, serviceId } });
      return data.data;
    },
    enabled: !!staffId && !!date && !!serviceId,
  });

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    return d.toISOString().split('T')[0];
  });

  const create = useMutation({
    mutationFn: async () => {
      const dateObj = new Date(date);
      const [sh, sm] = slot!.start.split(':').map(Number);
      const [eh, em] = slot!.end.split(':').map(Number);
      const startTime = new Date(dateObj); startTime.setHours(sh, sm, 0, 0);
      const endTime = new Date(dateObj); endTime.setHours(eh, em, 0, 0);

      await api.post('/appointments', {
        clientId, staffId, serviceId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });
    },
    onSuccess,
  });

  return (
    <div className="fixed inset-0 z-[60] bg-bg overflow-y-auto">
      {/* Липкий header с крестиком */}
      <div className="sticky top-0 z-10 bg-bg/95 backdrop-blur-xl border-b border-line">
        <div className="max-w-[640px] mx-auto px-6 py-4 flex items-center justify-between">
          <h2 className="text-h3">Записать пациента</h2>
          <button onClick={onClose}
            className="w-10 h-10 rounded-full bg-bg-card shadow-soft flex items-center justify-center active:scale-95">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-[640px] mx-auto px-6 py-6 pb-12">

          <div className="stack">
            {/* Услуга */}
            <div>
              <label className="text-[12px] text-ink-secondary font-bold mb-2 block">Услуга</label>
              <div className="stack-sm max-h-[200px] overflow-y-auto">
                {(services || []).map((s: Record<string, unknown>) => (
                  <button key={s.id as string} onClick={() => setServiceId(s.id as string)}
                    className={`text-left p-3 rounded-md transition-all active:scale-[0.98]
                      ${serviceId === s.id ? 'bg-brand text-white' : 'bg-bg-card shadow-soft'}`}>
                    <p className="text-[13px] font-semibold">{s.name as string}</p>
                    <p className={`text-[11px] mt-0.5 ${serviceId === s.id ? 'text-white/75' : 'text-ink-tertiary'}`}>
                      {(s.price as number).toLocaleString('ru')}&nbsp;₽ · {s.duration as number}&nbsp;мин
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Врач */}
            {serviceId && (
              <div>
                <label className="text-[12px] text-ink-secondary font-bold mb-2 block">Врач</label>
                <div className="grid grid-cols-2 gap-2">
                  {(staff || []).filter((s: Record<string, unknown>) => s.isActive).map((s: Record<string, unknown>) => (
                    <button key={s.id as string} onClick={() => setStaffId(s.id as string)}
                      className={`text-left p-3 rounded-md transition-all active:scale-[0.98]
                        ${staffId === s.id ? 'bg-brand text-white' : 'bg-bg-card shadow-soft'}`}>
                      <p className="text-[12px] font-semibold">{(s.user as Record<string, unknown>)?.name as string}</p>
                      <p className={`text-[10px] mt-0.5 ${staffId === s.id ? 'text-white/75' : 'text-brand'}`}>
                        {s.specialty as string}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Дата */}
            {staffId && (
              <div>
                <label className="text-[12px] text-ink-secondary font-bold mb-2 block">Дата</label>
                <div className="grid grid-cols-4 gap-2">
                  {dates.map((d) => {
                    const dt = new Date(d);
                    return (
                      <button key={d} onClick={() => setDate(d)}
                        className={`py-2 rounded-md text-center transition-all active:scale-[0.95]
                          ${date === d ? 'bg-brand text-white' : 'bg-bg-card shadow-soft'}`}>
                        <p className="text-[9px] uppercase font-semibold opacity-75">{dt.toLocaleDateString('ru-RU', { weekday: 'short' })}</p>
                        <p className="text-[15px] font-extrabold">{dt.getDate()}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Время */}
            {date && slots && (
              <div>
                <label className="text-[12px] text-ink-secondary font-bold mb-2 block">Время</label>
                {slots.length === 0 ? (
                  <p className="text-[13px] text-ink-tertiary">Нет свободных слотов</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {(slots as { start: string; end: string }[]).map((s) => (
                      <button key={s.start} onClick={() => setSlot(s)}
                        className={`py-2 rounded-md text-center text-[13px] font-bold transition-all
                          ${slot?.start === s.start ? 'bg-brand text-white' : 'bg-bg-card shadow-soft'}`}>
                        {s.start}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button onClick={() => create.mutate()}
              disabled={!serviceId || !staffId || !date || !slot || create.isPending}
              className="w-full mt-2 bg-brand text-white py-4 rounded-md text-[15px] font-bold shadow-button
                active:scale-[0.97] transition-transform disabled:opacity-40">
              {create.isPending ? 'Запись...' : 'Записать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
