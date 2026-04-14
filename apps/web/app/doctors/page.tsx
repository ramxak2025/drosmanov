'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { User, Calendar, X, Phone, ArrowRight } from 'lucide-react';
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
    <div className="px-6 pt-12 pb-8">
      <h1 className="text-h2">Наши врачи</h1>
      <p className="text-[15px] text-ink-secondary mt-2 mb-8">
        Опытные специалисты с&nbsp;многолетним стажем
      </p>

      {/* Grid 2 колонки — вертикальные карточки */}
      <div className="grid grid-cols-2 gap-4">
        {active.map((s: Record<string, unknown>) => {
          const name = (s.user as Record<string, unknown>)?.name as string || '';
          const parts = name.split(' ');
          const initials = parts.map((w: string) => w[0]).join('').slice(0, 2);
          const short = parts[0] + (parts[1] ? ' ' + parts[1][0] + '.' : '');

          return (
            <button key={s.id as string} onClick={() => setOpenId(s.id as string)} className="text-left">
              <div className="bg-bg-card rounded-lg shadow-card overflow-hidden
                active:scale-[0.97] transition-transform">
                {/* Вертикальное фото 3:4 */}
                <div className="aspect-[3/4] bg-brand-light relative">
                  {s.photoPath ? (
                    <img src={`/api/uploads/${s.photoPath}`} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[40px] font-extrabold text-brand/25">{initials}</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[13px] font-bold leading-snug">{short}</p>
                  <p className="text-[11px] text-brand font-semibold mt-1 truncate">{s.specialty as string}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Модальное окно врача */}
      {opened && <DoctorModal doctor={opened as Record<string, unknown>} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function DoctorModal({ doctor, onClose }: { doctor: Record<string, unknown>; onClose: () => void }) {
  const name = (doctor.user as Record<string, unknown>)?.name as string || '';
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2);
  const sched = doctor.workSchedule as Record<string, { start: string; end: string } | null> | null;
  const days = sched
    ? Object.entries(sched).filter(([,v]) => v).map(([k,v]) =>
        `${D[k]} ${(v as {start:string}).start}–${(v as {end:string}).end}`)
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div className="w-full max-w-page mx-auto bg-bg rounded-t-xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>

        {/* Вертикальное фото */}
        <div className="aspect-[4/5] bg-brand-light relative">
          {doctor.photoPath ? (
            <img src={`/api/uploads/${doctor.photoPath}`} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[80px] font-extrabold text-brand/25">{initials}</span>
            </div>
          )}
          <button onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md
              flex items-center justify-center active:scale-95">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-8">
          <h2 className="text-h2">{name}</h2>
          <p className="text-[14px] text-brand font-semibold mt-2">{doctor.specialty as string}</p>

          {doctor.bio && (
            <p className="text-[14px] text-ink-secondary mt-6 leading-relaxed">{doctor.bio as string}</p>
          )}

          {days.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-ink-tertiary" />
                <p className="text-[11px] text-ink-tertiary font-bold uppercase tracking-[0.1em]">Расписание</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {days.map((d) => (
                  <span key={d} className="text-xs bg-brand-subtle text-brand-dark px-3 py-[7px] rounded-sm font-semibold">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Link href={`/booking?staffId=${doctor.id}`}
            className="flex items-center justify-center gap-2 mt-8 bg-brand text-white w-full
              py-4 rounded-md text-[15px] font-bold shadow-button active:scale-[0.97] transition-transform">
            Записаться к врачу <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
