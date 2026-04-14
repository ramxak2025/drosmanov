'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Calendar, ArrowRight, Award, Briefcase, X, Stethoscope,
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

      {/* Список карточек (каждая может быть раскрытой или сложенной) */}
      <div className="px-6 stack">
        {active.map((s: Record<string, unknown>) => {
          const isOpen = openId === s.id;
          if (isOpen) {
            return <DoctorExpanded key={s.id as string} doctor={s} onClose={() => setOpenId(null)} />;
          }
          return <DoctorCardCompact key={s.id as string} doctor={s} onOpen={() => setOpenId(s.id as string)} />;
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

/* ═══ Сложенная карточка (горизонтальная с фото слева) ═══ */
function DoctorCardCompact({ doctor, onOpen }: { doctor: Record<string, unknown>; onOpen: () => void }) {
  const name = (doctor.user as Record<string, unknown>)?.name as string || '';
  const parts = name.split(' ');
  const initials = parts.map((w: string) => w[0]).join('').slice(0, 2);
  const first = parts[0] || '';
  const lastName = parts[1] || '';

  return (
    <button onClick={onOpen} className="text-left active:scale-[0.98] transition-transform">
      <div className="bg-bg-card rounded-xl shadow-card overflow-hidden flex">
        {/* Вертикальное фото слева */}
        <div className="w-[120px] aspect-portrait flex-shrink-0 relative">
          {doctor.photoPath ? (
            <img src={`/api/uploads/${doctor.photoPath}`} alt={name}
              className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-light to-brand-subtle
              flex items-center justify-center">
              <span className="text-[32px] font-extrabold text-brand/30">{initials}</span>
            </div>
          )}
        </div>
        {/* Инфо справа */}
        <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
          <div>
            <p className="text-[10px] font-bold text-brand tracking-[0.15em] uppercase">
              {doctor.specialty as string}
            </p>
            <h3 className="text-[16px] font-extrabold mt-1.5 leading-tight">{first}</h3>
            <p className="text-[16px] font-extrabold leading-tight">{lastName}</p>
          </div>
          <div className="flex items-center gap-1 text-brand">
            <span className="text-[11px] font-semibold">Подробнее</span>
            <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </button>
  );
}

/* ═══ Раскрытая карточка inline: вертикальное фото во всю ширину ═══ */
function DoctorExpanded({ doctor, onClose }: { doctor: Record<string, unknown>; onClose: () => void }) {
  const name = (doctor.user as Record<string, unknown>)?.name as string || '';
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2);
  const sched = doctor.workSchedule as Record<string, { start: string; end: string } | null> | null;
  const days = sched
    ? Object.entries(sched).filter(([,v]) => v).map(([k,v]) =>
        ({ day: D[k], start: (v as {start:string}).start, end: (v as {end:string}).end }))
    : [];

  return (
    <div className="bg-bg-card rounded-xl shadow-elevated overflow-hidden animate-fade-in">
      {/* БОЛЬШОЕ вертикальное фото 3:4 */}
      <div className="aspect-portrait relative bg-ink">
        {doctor.photoPath ? (
          <img src={`/api/uploads/${doctor.photoPath}`} alt={name}
            className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-light to-brand-subtle
            flex items-center justify-center">
            <span className="text-[120px] font-extrabold text-brand/25">{initials}</span>
          </div>
        )}

        {/* Сильный градиент для читаемости */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/15" />

        {/* Закрыть */}
        <button onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/15 backdrop-blur-lg
            border border-white/25 flex items-center justify-center active:scale-95">
          <X size={18} className="text-white" />
        </button>

        {/* Бейдж специальности */}
        <div className="absolute top-5 left-5">
          <div className="bg-white/15 backdrop-blur-lg border border-white/25
            px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Stethoscope size={11} className="text-white" />
            <p className="text-[10px] font-bold text-white tracking-wide uppercase">
              {doctor.specialty as string}
            </p>
          </div>
        </div>

        {/* Имя + CTA поверх фото */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h2 className="text-[32px] font-extrabold text-white leading-[1.05] tracking-tight">
            {name}
          </h2>

          <Link href={`/booking?staffId=${doctor.id}`}
            className="mt-5 inline-flex items-center gap-2 bg-brand text-white
              px-6 py-3 rounded-md text-[14px] font-bold shadow-button
              active:scale-[0.97] transition-transform">
            Записаться <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Инфо под фото */}
      <div className="p-6">
        {doctor.bio && (
          <div className="mb-6">
            <p className="text-[10px] text-ink-tertiary font-bold uppercase tracking-[0.12em] mb-3">
              О враче
            </p>
            <p className="text-[14px] text-ink leading-relaxed">{doctor.bio as string}</p>
          </div>
        )}

        {days.length > 0 && (
          <div>
            <p className="text-[10px] text-ink-tertiary font-bold uppercase tracking-[0.12em] mb-3">
              График работы
            </p>
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
