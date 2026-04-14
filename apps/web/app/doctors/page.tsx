'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Calendar, ArrowRight, Award, Briefcase, X,
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

      {/* Grid 2 колонки */}
      <div className="px-6 grid grid-cols-2 gap-3">
        {active.map((s: Record<string, unknown>) => {
          const name = (s.user as Record<string, unknown>)?.name as string || '';
          const parts = name.split(' ');
          const initials = parts.map((w: string) => w[0]).join('').slice(0, 2);
          const first = parts[0] || '';
          const last = parts[1] || '';
          const isOpen = openId === s.id;

          if (isOpen) {
            // Раскрытая карточка — занимает 2 колонки
            return (
              <div key={s.id as string} className="col-span-2">
                <DoctorExpanded doctor={s} onClose={() => setOpenId(null)} />
              </div>
            );
          }

          return (
            <button key={s.id as string} onClick={() => setOpenId(s.id as string)}
              className="text-left active:scale-[0.97] transition-transform">
              <div className="relative overflow-hidden rounded-xl bg-ink shadow-card">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  <div className="absolute top-3 left-3">
                    <div className="bg-white/15 backdrop-blur-md border border-white/20
                      px-2.5 py-1 rounded-full">
                      <p className="text-[10px] font-semibold text-white tracking-wide">
                        {s.specialty as string}
                      </p>
                    </div>
                  </div>

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

      {/* Преимущества */}
      <div className="px-6 mt-12">
        <h2 className="text-h3 mb-5">Почему наши врачи</h2>
        <div className="stack">
          <Feature icon={Award} title="Сертифицированы" text="Международные дипломы и регулярное повышение квалификации" />
          <Feature icon={Briefcase} title="Большой опыт" text="От 8 до 15 лет практики в современной стоматологии" />
          <Feature icon={Calendar} title="Гибкий график" text="Работаем 6 дней в неделю, удобное время для записи" />
        </div>
      </div>
    </div>
  );
}

/* ══ Раскрытая карточка врача inline ══ */
function DoctorExpanded({ doctor, onClose }: { doctor: Record<string, unknown>; onClose: () => void }) {
  const name = (doctor.user as Record<string, unknown>)?.name as string || '';
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2);
  const sched = doctor.workSchedule as Record<string, { start: string; end: string } | null> | null;
  const days = sched
    ? Object.entries(sched).filter(([,v]) => v).map(([k,v]) =>
        ({ day: D[k], start: (v as {start:string}).start, end: (v as {end:string}).end }))
    : [];

  return (
    <div className="bg-bg-card rounded-xl shadow-elevated overflow-hidden">
      {/* Hero портрет */}
      <div className="aspect-[16/9] relative bg-brand-light">
        {doctor.photoPath ? (
          <img src={`/api/uploads/${doctor.photoPath}`} alt={name}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[80px] font-extrabold text-brand/30">{initials}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        <button onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-lg
            border border-white/30 flex items-center justify-center active:scale-95">
          <X size={16} className="text-white" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-[10px] font-bold text-white/80 tracking-[0.15em] uppercase mb-1">
            {doctor.specialty as string}
          </p>
          <h3 className="text-[22px] font-extrabold text-white leading-tight tracking-tight">{name}</h3>
        </div>
      </div>

      <div className="p-5">
        {doctor.bio && (
          <div className="mb-6">
            <p className="text-[10px] text-ink-tertiary font-bold uppercase tracking-[0.1em] mb-2">О враче</p>
            <p className="text-[14px] text-ink leading-relaxed">{doctor.bio as string}</p>
          </div>
        )}

        {days.length > 0 && (
          <div className="mb-5">
            <p className="text-[10px] text-ink-tertiary font-bold uppercase tracking-[0.1em] mb-3">График работы</p>
            <div className="bg-brand-subtle rounded-md overflow-hidden">
              {days.map(({ day, start, end }, i) => (
                <div key={day}
                  className={`px-4 py-3 flex items-center justify-between
                    ${i > 0 ? 'border-t border-brand/10' : ''}`}>
                  <span className="text-[13px] font-semibold">{day}</span>
                  <span className="text-[13px] text-ink-secondary font-medium tabular-nums">{start}–{end}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link href={`/booking?staffId=${doctor.id}`}
          className="flex items-center justify-center gap-2 bg-brand text-white w-full
            py-3 rounded-md text-[14px] font-bold shadow-button active:scale-[0.97] transition-transform">
          Записаться <ArrowRight size={14} />
        </Link>
      </div>
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
