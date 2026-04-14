'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Calendar, X, ArrowRight, Award, Briefcase,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

const D: Record<string, string> = { mon:'Пн', tue:'Вт', wed:'Ср', thu:'Чт', fri:'Пт', sat:'Сб', sun:'Вс' };

export default function DoctorsPage() {
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => { const { data } = await api.get('/staff'); return data.data; },
  });

  const active = (staff || []).filter((s: Record<string, unknown>) => s.isActive);
  const opened = active.find((s: Record<string, unknown>) => s.id === openId);

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-6 pt-12 mb-8">
        <p className="text-[11px] font-bold text-brand tracking-[0.15em] uppercase mb-3">
          Команда профессионалов
        </p>
        <h1 className="text-h1">Врачи</h1>
        <p className="text-[15px] text-ink-secondary mt-3 leading-relaxed max-w-[280px]">
          Опытные специалисты с&nbsp;международными сертификатами
        </p>
      </div>

      {/* Grid 2 колонки — журнальный стиль */}
      <div className="px-6 grid grid-cols-2 gap-3">
        {active.map((s: Record<string, unknown>, i: number) => {
          const name = (s.user as Record<string, unknown>)?.name as string || '';
          const parts = name.split(' ');
          const initials = parts.map((w: string) => w[0]).join('').slice(0, 2);
          const first = parts[0] || '';
          const last = parts[1] || '';

          return (
            <button key={s.id as string} onClick={() => setOpenId(s.id as string)}
              className="text-left active:scale-[0.97] transition-transform">
              <div className="relative overflow-hidden rounded-xl bg-ink shadow-card">
                {/* Портретное фото */}
                <div className="aspect-portrait relative">
                  {s.photoPath ? (
                    <img src={`/api/uploads/${s.photoPath}`} alt={name}
                      className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-light to-brand-subtle
                      flex items-center justify-center">
                      <span className="text-[54px] font-extrabold text-brand/30">{initials}</span>
                    </div>
                  )}
                  {/* Градиент-оверлей для читаемости */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* Бейдж специальности */}
                  <div className="absolute top-3 left-3">
                    <div className="bg-white/15 backdrop-blur-md border border-white/20
                      px-2.5 py-1 rounded-full">
                      <p className="text-[10px] font-semibold text-white tracking-wide">
                        {s.specialty as string}
                      </p>
                    </div>
                  </div>

                  {/* Имя поверх фото */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white text-[15px] font-extrabold leading-tight">{first}</p>
                    <p className="text-white/90 text-[15px] font-extrabold leading-tight">{last}</p>
                    <div className="flex items-center gap-1 mt-2 text-white/75">
                      <span className="text-[10px] font-semibold">Подробнее</span>
                      <ArrowRight size={11} />
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Блок "Почему наши врачи" */}
      <div className="px-6 mt-12">
        <h2 className="text-h3 mb-5">Почему наши врачи</h2>
        <div className="stack">
          <Feature icon={Award} title="Сертифицированы" text="Международные дипломы и регулярное повышение квалификации" />
          <Feature icon={Briefcase} title="Большой опыт" text="От 8 до 15 лет практики в современной стоматологии" />
          <Feature icon={Calendar} title="Гибкий график" text="Работаем 6 дней в неделю, удобное время для записи" />
        </div>
      </div>

      {opened && <DoctorModal doctor={opened as Record<string, unknown>} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function Feature({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return (
    <div className="bg-bg-card rounded-lg shadow-card p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-md bg-brand-subtle flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-brand-dark" />
      </div>
      <div>
        <p className="text-[15px] font-bold">{title}</p>
        <p className="text-[13px] text-ink-secondary mt-1 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function DoctorModal({ doctor, onClose }: { doctor: Record<string, unknown>; onClose: () => void }) {
  const name = (doctor.user as Record<string, unknown>)?.name as string || '';
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2);
  const sched = doctor.workSchedule as Record<string, { start: string; end: string } | null> | null;
  const days = sched
    ? Object.entries(sched).filter(([,v]) => v).map(([k,v]) =>
        ({ day: D[k], start: (v as {start:string}).start, end: (v as {end:string}).end }))
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div className="w-full max-w-page mx-auto bg-bg rounded-t-xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>

        {/* Большое портретное фото */}
        <div className="aspect-portrait relative">
          {doctor.photoPath ? (
            <img src={`/api/uploads/${doctor.photoPath}`} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-light to-brand-subtle
              flex items-center justify-center">
              <span className="text-[80px] font-extrabold text-brand/30">{initials}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          <button onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-lg
              border border-white/25 flex items-center justify-center active:scale-95">
            <X size={18} className="text-white" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="text-[11px] font-bold text-white/80 tracking-[0.15em] uppercase mb-2">
              {doctor.specialty as string}
            </p>
            <h2 className="text-[26px] font-extrabold text-white leading-tight tracking-tight">{name}</h2>
          </div>
        </div>

        <div className="px-6 py-8">
          {doctor.bio && (
            <div className="mb-8">
              <p className="text-[11px] text-ink-tertiary font-bold uppercase tracking-[0.1em] mb-3">О враче</p>
              <p className="text-[15px] text-ink leading-relaxed">{doctor.bio as string}</p>
            </div>
          )}

          {days.length > 0 && (
            <div>
              <p className="text-[11px] text-ink-tertiary font-bold uppercase tracking-[0.1em] mb-4">График работы</p>
              <div className="bg-bg-card rounded-lg shadow-card overflow-hidden">
                {days.map(({ day, start, end }, i) => (
                  <div key={day}
                    className={`px-5 py-4 flex items-center justify-between
                      ${i > 0 ? 'border-t border-line' : ''}`}>
                    <span className="text-[14px] font-semibold">{day}</span>
                    <span className="text-[14px] text-ink-secondary font-medium tabular-nums">{start}–{end}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link href={`/booking?staffId=${doctor.id}`}
            className="flex items-center justify-center gap-2 mt-8 bg-brand text-white w-full
              py-4 rounded-md text-[15px] font-bold shadow-button active:scale-[0.97] transition-transform">
            Записаться на приём <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
