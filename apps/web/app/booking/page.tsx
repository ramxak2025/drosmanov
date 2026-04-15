'use client';

import { useState, Suspense, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ChevronLeft, Calendar as CalIcon, Clock, User as UserIcon,
  Phone, Check, CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="px-6 pt-12"><h1 className="text-h2">Запись</h1></div>}>
      <BookingForm />
    </Suspense>
  );
}

type Step = 'service' | 'doctor' | 'date' | 'time' | 'contact' | 'done';

function BookingForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const initServiceId = sp.get('serviceId');

  const [step, setStep] = useState<Step>(initServiceId ? 'doctor' : 'service');
  const [serviceId, setServiceId] = useState(initServiceId || '');
  const [staffId, setStaffId] = useState('ANY');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<{ start: string; end: string } | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [agreedPersonal, setAgreedPersonal] = useState(false);
  const [agreedContract, setAgreedContract] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => { const { data } = await api.get('/services'); return data.data; },
  });
  // Фильтруем врачей по услуге, чтобы показывать только тех, кто её оказывает
  const { data: staff } = useQuery({
    queryKey: ['staff-by-service', serviceId],
    queryFn: async () => {
      const url = serviceId ? `/staff?serviceId=${serviceId}` : '/staff';
      const { data } = await api.get(url);
      return data.data;
    },
    enabled: !!serviceId,
  });

  const service = (services || []).find((s: Record<string, unknown>) => s.id === serviceId);
  const doctor = (staff || []).find((s: Record<string, unknown>) => s.id === staffId);

  const { data: slots } = useQuery({
    queryKey: ['slots', staffId, date, serviceId],
    queryFn: async () => {
      const { data } = await api.get('/appointments/slots', { params: { staffId, date, serviceId } });
      return data.data as { start: string; end: string }[];
    },
    enabled: !!staffId && !!date && !!serviceId,
  });

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    return d.toISOString().split('T')[0];
  });

  const fmt = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (d.length <= 1) return '+7';
    let r = '+7';
    if (d.length > 1) r += ' (' + d.slice(1, 4);
    if (d.length > 4) r += ') ' + d.slice(4, 7);
    if (d.length > 7) r += '-' + d.slice(7, 9);
    if (d.length > 9) r += '-' + d.slice(9, 11);
    return r;
  };
  const rawPhone = () => '+7' + phone.replace(/\D/g, '').slice(1);

  const submit = async () => {
    if (!agreedPersonal || !agreedContract) return;
    setError('');
    setSubmitting(true);
    try {
      // Регистрация или поиск пользователя (пароль = последние 4 цифры телефона)
      const pwd = rawPhone().slice(-4);
      try {
        await api.post('/auth/register', { phone: rawPhone(), password: pwd + '0000', name });
      } catch {
        // Пользователь уже существует — логинимся
        await api.post('/auth/login', { phone: rawPhone(), password: pwd + '0000' });
      }

      // Создаём запись
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

      setStep('done');
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ошибка записи. Попробуйте позвонить.');
    } finally {
      setSubmitting(false);
    }
  };

  const canGoNext = () => {
    if (step === 'service') return !!serviceId;
    if (step === 'doctor') return !!staffId;
    if (step === 'date') return !!date;
    if (step === 'time') return !!slot;
    if (step === 'contact') return name.trim().length > 0 && rawPhone().length === 12 && agreedPersonal && agreedContract;
    return false;
  };

  const next = () => {
    const order: Step[] = ['service', 'doctor', 'date', 'time', 'contact'];
    const i = order.indexOf(step);
    if (i < order.length - 1) setStep(order[i + 1]);
  };

  const back = () => {
    const order: Step[] = ['service', 'doctor', 'date', 'time', 'contact'];
    const i = order.indexOf(step);
    if (i > 0) setStep(order[i - 1]);
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
          <p className="text-[15px] text-ink-secondary mt-3">Мы ждём вас</p>
        </div>

        <div className="bg-bg-card rounded-lg shadow-card p-6 mt-8 stack-sm">
          <Row label="Услуга" value={service?.name as string || ''} />
          <Row label="Врач" value={(doctor?.user as Record<string, unknown>)?.name as string || ''} />
          <Row label="Дата" value={new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} />
          <Row label="Время" value={slot?.start || ''} />
        </div>

        <Link href="/"
          className="flex items-center justify-center gap-2 mt-6 bg-brand text-white w-full
            py-4 rounded-md text-[15px] font-bold shadow-button active:scale-[0.97] transition-transform">
          На главную
        </Link>
      </div>
    );
  }

  const steps: Step[] = ['service', 'doctor', 'date', 'time', 'contact'];
  const stepIndex = steps.indexOf(step);

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
                <button key={s.id as string} onClick={() => { setServiceId(s.id as string); setTimeout(next, 150); }}
                  className={`w-full text-left bg-bg-card rounded-lg p-4 flex items-center justify-between gap-3
                    transition-all active:scale-[0.98]
                    ${serviceId === s.id ? 'ring-2 ring-brand shadow-soft' : 'shadow-card'}`}>
                  <div>
                    <p className="text-[15px] font-semibold">{s.name as string}</p>
                    <p className="text-xs text-ink-tertiary mt-1">{s.duration as number} мин</p>
                  </div>
                  <span className="text-[15px] font-extrabold text-brand">
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
              Или оставьте &laquo;Любой врач&raquo; — запишем к&nbsp;специалисту с&nbsp;ближайшим окном
            </p>
            <div className="mt-6 stack-sm">
              {/* Первый пункт — Любой врач (по умолчанию) */}
              <button onClick={() => { setStaffId('ANY'); setTimeout(next, 150); }}
                className={`w-full text-left bg-bg-card rounded-lg p-4 flex items-center gap-4
                  transition-all active:scale-[0.98]
                  ${staffId === 'ANY' ? 'ring-2 ring-brand shadow-soft' : 'shadow-card'}`}>
                <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                  <UserIcon size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold flex items-center gap-2">
                    Любой свободный врач
                    <span className="text-[10px] font-bold text-brand bg-brand-subtle px-2 py-[2px] rounded-full">
                      РЕКОМЕНДУЕМ
                    </span>
                  </p>
                  <p className="text-xs text-ink-tertiary mt-1">Система подберёт врача автоматически</p>
                </div>
              </button>

              {(staff || []).filter((s: Record<string, unknown>) => s.isActive).map((s: Record<string, unknown>) => {
                const name = (s.user as Record<string, unknown>)?.name as string || '';
                const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2);
                return (
                  <button key={s.id as string} onClick={() => { setStaffId(s.id as string); setTimeout(next, 150); }}
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

        {/* ── Контакты ── */}
        {step === 'contact' && (
          <>
            <h1 className="text-h2">Ваши данные</h1>
            <p className="text-[14px] text-ink-secondary mt-2 mb-6">Мы позвоним для подтверждения</p>

            <div className="stack">
              <InputField label="Имя" icon={UserIcon} value={name} onChange={setName} placeholder="Ваше имя" />
              <InputField label="Телефон" icon={Phone} type="tel" value={phone}
                onChange={(v) => setPhone(fmt(v))} placeholder="+7 (900) 123-45-67" />
              <div>
                <label className="text-[12px] text-ink-secondary font-semibold mb-2 block">Комментарий (необязательно)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  placeholder="Что беспокоит?"
                  className="w-full px-4 py-3 rounded-md bg-bg-card text-[15px] shadow-soft outline-none
                    focus:ring-2 focus:ring-brand/20 resize-none" />
              </div>
            </div>

            {/* Сводка */}
            <div className="bg-bg-card rounded-lg shadow-card p-5 mt-6 stack-sm">
              <Row label="Услуга" value={service?.name as string || ''} />
              <Row label="Врач" value={(doctor?.user as Record<string, unknown>)?.name as string || ''} />
              <Row label="Дата" value={new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) + ', ' + (slot?.start || '')} />
              <Row label="Стоимость" value={`${(service?.price as number || 0).toLocaleString('ru')} ₽`} bold />
            </div>

            {/* Согласие на обработку ПД */}
            <div className="mt-6 stack-sm">
              <Checkbox checked={agreedPersonal} onChange={setAgreedPersonal}>
                Я&nbsp;даю согласие на&nbsp;обработку моих <a href="#" className="text-brand font-semibold underline">персональных данных</a> в&nbsp;соответствии с&nbsp;152-ФЗ
              </Checkbox>
              <Checkbox checked={agreedContract} onChange={setAgreedContract}>
                Я&nbsp;принимаю <a href="#" className="text-brand font-semibold underline">условия</a> оказания медицинских услуг и&nbsp;политику конфиденциальности
              </Checkbox>
            </div>

            {error && (
              <p className="mt-4 text-[13px] text-status-red font-medium text-center">{error}</p>
            )}

            <button onClick={submit} disabled={!canGoNext() || submitting}
              className="w-full mt-6 bg-brand text-white py-4 rounded-md text-[15px] font-bold shadow-button
                active:scale-[0.97] transition-transform disabled:opacity-40 disabled:pointer-events-none
                flex items-center justify-center gap-2">
              {submitting ? 'Записываем...' : <>Записаться <Check size={16} /></>}
            </button>
            <p className="text-[11px] text-ink-tertiary text-center mt-3">
              Нажимая кнопку, вы соглашаетесь с&nbsp;условиями
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[13px] text-ink-tertiary">{label}</span>
      <span className={`text-[14px] text-right ${bold ? 'font-extrabold text-brand' : 'font-semibold'}`}>{value}</span>
    </div>
  );
}

function InputField({ label, icon: Icon, value, onChange, type = 'text', placeholder }: {
  label: string; icon: React.ElementType; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[12px] text-ink-secondary font-semibold mb-2 block">{label}</label>
      <div className="relative">
        <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-disabled" />
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full pl-11 pr-4 py-[14px] rounded-md bg-bg-card text-[15px] shadow-soft outline-none
            focus:ring-2 focus:ring-brand/20 placeholder:text-ink-disabled" />
      </div>
    </div>
  );
}

function Checkbox({ checked, onChange, children }: {
  checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer active:opacity-70">
      <button type="button" onClick={() => onChange(!checked)}
        className={`flex-shrink-0 w-5 h-5 rounded-[5px] border-2 transition-all mt-0.5
          ${checked ? 'bg-brand border-brand' : 'bg-white border-line-strong'}
          flex items-center justify-center`}>
        {checked && <Check size={13} strokeWidth={3} className="text-white" />}
      </button>
      <span className="text-[12px] text-ink-secondary leading-relaxed">{children}</span>
    </label>
  );
}
