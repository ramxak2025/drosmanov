'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, Clock, User as UserIcon, CheckCircle2, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRequireAuth } from '@/lib/auth';
import api from '@/lib/api';

type Step = 'service' | 'doctor' | 'date' | 'time' | 'confirm' | 'done';

export default function ClientBookingPage() {
  useRequireAuth(['CLIENT']);
  const router = useRouter();

  const [step, setStep] = useState<Step>('service');
  const [serviceId, setServiceId] = useState('');
  const [staffId, setStaffId] = useState('ANY');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<{ start: string; end: string } | null>(null);
  const [notes, setNotes] = useState('');

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => { const { data } = await api.get('/services'); return data.data; },
  });

  const { data: staff } = useQuery({
    queryKey: ['staff-by-service', serviceId],
    queryFn: async () => {
      const url = serviceId ? `/staff?serviceId=${serviceId}` : '/staff';
      const { data } = await api.get(url);
      return data.data;
    },
    enabled: !!serviceId,
  });

  const { data: slots } = useQuery({
    queryKey: ['slots', staffId, date, serviceId],
    queryFn: async () => {
      const { data } = await api.get('/appointments/slots', {
        params: { staffId, date, serviceId },
      });
      return data.data as { start: string; end: string }[];
    },
    enabled: !!staffId && !!date && !!serviceId,
  });

  const service = (services || []).find((s: Record<string, unknown>) => s.id === serviceId);
  const doctor = (staff || []).find((s: Record<string, unknown>) => s.id === staffId);

  const createMutation = useMutation({
    mutationFn: async () => {
      const dateObj = new Date(date);
      const [sh, sm] = slot!.start.split(':').map(Number);
      const [eh, em] = slot!.end.split(':').map(Number);
      const startTime = new Date(dateObj); startTime.setHours(sh, sm, 0, 0);
      const endTime = new Date(dateObj); endTime.setHours(eh, em, 0, 0);
      await api.post('/appointments', {
        staffId, serviceId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: notes || undefined,
      });
    },
    onSuccess: () => setStep('done'),
  });

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    return d.toISOString().split('T')[0];
  });

  const steps: Step[] = ['service', 'doctor', 'date', 'time', 'confirm'];
  const stepIndex = steps.indexOf(step);

  const next = () => {
    if (stepIndex < steps.length - 1) setStep(steps[stepIndex + 1]);
  };

  const back = () => {
    if (stepIndex > 0) setStep(steps[stepIndex - 1]);
    else router.back();
  };

  /* ══ Успех ══ */
  if (step === 'done') {
    return (
      <div className="px-6 pt-20 pb-8">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-status-green/15 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-status-green" />
          </div>
          <h1 className="text-h2">Вы записаны!</h1>
          <p className="text-[15px] text-ink-secondary mt-3">Мы ждём вас в клинике</p>
        </div>

        <div className="bg-bg-card rounded-lg shadow-card p-6 mt-8 stack-sm">
          <SummaryRow label="Услуга" value={service?.name as string || ''} />
          <SummaryRow label="Врач" value={staffId === 'ANY' ? 'Любой врач' : ((doctor?.user as Record<string, unknown>)?.name as string || '')} />
          <SummaryRow label="Дата" value={new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} />
          <SummaryRow label="Время" value={slot?.start || ''} />
        </div>

        <Link href="/client/visits"
          className="flex items-center justify-center gap-2 mt-6 bg-brand text-white w-full
            py-4 rounded-md text-[15px] font-bold shadow-button active:scale-[0.97] transition-transform">
          Мои визиты <ArrowRight size={16} />
        </Link>

        <Link href="/client/home"
          className="block text-center text-sm text-ink-tertiary mt-4 font-medium">
          На главную
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-6 pt-6 flex items-center gap-3 mb-2">
        <button onClick={back}
          className="w-10 h-10 rounded-full bg-bg-card shadow-soft flex items-center justify-center active:scale-95">
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm text-ink-tertiary font-semibold">
          Шаг {stepIndex + 1} из 5
        </p>
      </div>

      {/* Progress */}
      <div className="px-6 mt-4">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className={`h-[3px] flex-1 rounded-full transition-colors
              ${i <= stepIndex ? 'bg-brand' : 'bg-line-strong'}`} />
          ))}
        </div>
      </div>

      <div className="px-6 mt-8">
        {/* ── Услуга ── */}
        {step === 'service' && (
          <>
            <h1 className="text-h2">Выберите услугу</h1>
            <div className="mt-6 stack-sm">
              {(services || []).map((s: Record<string, unknown>) => (
                <button key={s.id as string}
                  onClick={() => { setServiceId(s.id as string); setTimeout(next, 150); }}
                  className={`w-full text-left bg-bg-card rounded-lg p-4 flex items-center justify-between gap-3
                    transition-all active:scale-[0.98]
                    ${serviceId === s.id ? 'ring-2 ring-brand shadow-soft' : 'shadow-card'}`}>
                  <div>
                    <p className="text-[15px] font-semibold">{s.name as string}</p>
                    <p className="text-xs text-ink-tertiary mt-1">{s.duration as number} мин</p>
                  </div>
                  <span className="text-[15px] font-extrabold text-brand whitespace-nowrap">
                    {(s.price as number) === 0 ? 'бесплатно' : `${(s.price as number).toLocaleString('ru')} ₽`}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Врач ── */}
        {step === 'doctor' && (
          <>
            <h1 className="text-h2">Выберите врача</h1>
            <p className="text-[14px] text-ink-secondary mt-2 mb-4">
              Или оставьте &laquo;Любой врач&raquo; — запишем к&nbsp;свободному
            </p>
            <div className="mt-6 stack-sm">
              {/* Любой врач */}
              <button onClick={() => { setStaffId('ANY'); setTimeout(next, 150); }}
                className={`w-full text-left bg-bg-card rounded-lg p-4 flex items-center gap-4
                  transition-all active:scale-[0.98]
                  ${staffId === 'ANY' ? 'ring-2 ring-brand shadow-soft' : 'shadow-card'}`}>
                <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                  <UserIcon size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold flex items-center gap-2">
                    Любой врач
                    <span className="text-[10px] font-bold text-brand bg-brand-subtle px-2 py-[2px] rounded-full">
                      РЕКОМЕНДУЕМ
                    </span>
                  </p>
                  <p className="text-xs text-ink-tertiary mt-1">Подберём свободного специалиста</p>
                </div>
              </button>

              {(staff || []).filter((s: Record<string, unknown>) => s.isActive).map((s: Record<string, unknown>) => {
                const name = (s.user as Record<string, unknown>)?.name as string || '';
                const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2);
                return (
                  <button key={s.id as string}
                    onClick={() => { setStaffId(s.id as string); setTimeout(next, 150); }}
                    className={`w-full text-left bg-bg-card rounded-lg p-4 flex items-center gap-4
                      transition-all active:scale-[0.98]
                      ${staffId === s.id ? 'ring-2 ring-brand shadow-soft' : 'shadow-card'}`}>
                    <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-extrabold text-brand-dark">{initials}</span>
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold">{name}</p>
                      <p className="text-xs text-brand font-semibold mt-1">{s.specialty as string}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── Дата ── */}
        {step === 'date' && (
          <>
            <h1 className="text-h2">Выберите дату</h1>
            <div className="mt-6 grid grid-cols-4 gap-2">
              {dates.map((d) => {
                const dt = new Date(d);
                return (
                  <button key={d} onClick={() => { setDate(d); setTimeout(next, 150); }}
                    className={`bg-bg-card rounded-md p-3 text-center transition-all active:scale-[0.95]
                      ${date === d ? 'ring-2 ring-brand shadow-soft' : 'shadow-card'}`}>
                    <p className="text-[10px] text-ink-tertiary font-semibold uppercase">
                      {dt.toLocaleDateString('ru-RU', { weekday: 'short' })}
                    </p>
                    <p className="text-[18px] font-extrabold mt-1">{dt.getDate()}</p>
                    <p className="text-[10px] text-ink-tertiary mt-0.5">
                      {dt.toLocaleDateString('ru-RU', { month: 'short' })}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── Время ── */}
        {step === 'time' && (
          <>
            <h1 className="text-h2">Выберите время</h1>
            <div className="mt-6">
              {!slots || slots.length === 0 ? (
                <div className="text-center py-16">
                  <Clock size={32} className="text-ink-disabled mx-auto mb-4" />
                  <p className="text-sm text-ink-tertiary">Нет свободных слотов</p>
                  <p className="text-xs text-ink-disabled mt-1">Выберите другую дату</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((s) => (
                    <button key={s.start} onClick={() => { setSlot(s); setTimeout(next, 150); }}
                      className={`bg-bg-card rounded-md py-3 text-center transition-all active:scale-[0.95]
                        ${slot?.start === s.start ? 'ring-2 ring-brand shadow-soft bg-brand text-white' : 'shadow-card'}`}>
                      <p className="text-sm font-extrabold">{s.start}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Подтверждение ── */}
        {step === 'confirm' && (
          <>
            <h1 className="text-h2">Подтверждение</h1>

            <div className="bg-bg-card rounded-lg shadow-card p-6 mt-6 stack-sm">
              <SummaryRow label="Услуга" value={service?.name as string || ''} />
              <SummaryRow label="Врач" value={staffId === 'ANY' ? 'Любой врач' : ((doctor?.user as Record<string, unknown>)?.name as string || '')} />
              <SummaryRow label="Дата" value={new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) + ', ' + (slot?.start || '')} />
              <SummaryRow label="Стоимость" value={`${(service?.price as number || 0).toLocaleString('ru')} ₽`} bold />
            </div>

            <div className="mt-6">
              <label className="text-[12px] text-ink-secondary font-semibold mb-2 block">Комментарий (необязательно)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                placeholder="Что беспокоит?"
                className="w-full px-4 py-3 rounded-md bg-bg-card text-[15px] shadow-soft outline-none
                  focus:ring-2 focus:ring-brand/20 resize-none placeholder:text-ink-disabled" />
            </div>

            {createMutation.isError && (
              <p className="mt-4 text-[13px] text-status-red font-medium text-center">
                Ошибка записи. Попробуйте ещё раз.
              </p>
            )}

            <button onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="w-full mt-6 bg-brand text-white py-4 rounded-md text-[15px] font-bold shadow-button
                active:scale-[0.97] transition-transform disabled:opacity-40 disabled:pointer-events-none
                flex items-center justify-center gap-2">
              {createMutation.isPending ? 'Записываем...' : 'Подтвердить запись'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[13px] text-ink-tertiary">{label}</span>
      <span className={`text-[14px] text-right ${bold ? 'font-extrabold text-brand' : 'font-semibold'}`}>{value}</span>
    </div>
  );
}
