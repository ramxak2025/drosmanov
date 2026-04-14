'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowRight, Phone, MapPin, Clock, ChevronRight, Sparkles } from 'lucide-react';
import api from '@/lib/api';

export default function HomePage() {
  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => { const { data } = await api.get('/services'); return data.data; },
  });
  const { data: promotions } = useQuery({
    queryKey: ['promos'],
    queryFn: async () => { const { data } = await api.get('/promotions'); return data.data; },
  });
  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => { const { data } = await api.get('/staff'); return data.data; },
  });

  const cats = [...new Set((services || []).map((s: Record<string, unknown>) => s.category as string))];

  return (
    <div>

      {/* ══ Hero ══ */}
      <div className="px-6 pt-20 pb-16">
        <p className="text-caption font-bold text-brand tracking-[0.12em] uppercase mb-5">
          Стоматологическая клиника
        </p>
        <h1 className="text-h1 text-ink">Dr. Osmanov</h1>
        <p className="text-lg text-ink-secondary mt-5 max-w-[300px]">
          Современная клиника с&nbsp;заботой о&nbsp;каждом пациенте
        </p>
        <div className="flex gap-3 mt-10">
          <Link href="/price"
            className="inline-flex items-center gap-2 bg-brand text-white px-7 py-4 rounded-md
            text-md font-bold shadow-button active:scale-[0.97] transition-transform">
            Записаться <ArrowRight size={17} />
          </Link>
          <a href="tel:+78722123456"
            className="inline-flex items-center bg-bg-card text-ink px-6 py-4 rounded-md
            text-md font-medium shadow-soft active:scale-[0.97] transition-transform">
            Позвонить
          </a>
        </div>
      </div>

      {/* ══ Акции ══ */}
      {promotions && promotions.length > 0 && (
        <div className="mb-16">
          <div className="px-6 flex items-baseline justify-between mb-5">
            <h2 className="text-h2">Акции</h2>
            <Link href="/promos" className="text-sm text-brand font-semibold flex items-center gap-0.5">
              Все <ChevronRight size={15} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto px-6 pb-1 scrollbar-hide">
            {promotions.slice(0, 4).map((p: Record<string, unknown>) => (
              <div key={p.id as string} className="flex-shrink-0 w-[260px]">
                <div className="bg-brand-subtle rounded-lg p-6 h-full relative">
                  {p.discount && (
                    <span className="absolute top-5 right-5 bg-status-red text-white text-xs font-extrabold
                      w-10 h-10 rounded-full flex items-center justify-center">
                      -{p.discount as number}%
                    </span>
                  )}
                  <Sparkles size={17} className="text-brand-dark mb-4" />
                  <h3 className="text-base font-bold pr-8 leading-snug">{p.title as string}</h3>
                  {p.description && (
                    <p className="text-sm text-ink-secondary mt-3 line-clamp-2">{p.description as string}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ Цены и запись ══ */}
      <div className="px-6 mb-16">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-h2">Цены и запись</h2>
          <Link href="/price" className="text-sm text-brand font-semibold flex items-center gap-0.5">
            Все <ChevronRight size={15} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {cats.map((cat) => {
            const n = (services || []).filter((s: Record<string, unknown>) => s.category === cat).length;
            return (
              <Link key={cat} href={`/price?cat=${encodeURIComponent(cat)}`}>
                <div className="bg-bg-card rounded-lg p-5 shadow-card h-full
                  active:scale-[0.97] transition-transform">
                  <p className="text-base font-bold">{cat}</p>
                  <p className="text-sm text-ink-tertiary mt-2">{n} {plural(n)}</p>
                  <div className="mt-5">
                    <ChevronRight size={17} className="text-brand" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ══ Врачи ══ */}
      <div className="mb-16">
        <div className="px-6 flex items-baseline justify-between mb-5">
          <h2 className="text-h2">Врачи</h2>
          <Link href="/doctors" className="text-sm text-brand font-semibold flex items-center gap-0.5">
            Все <ChevronRight size={15} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto px-6 pb-1 scrollbar-hide">
          {(staff || []).filter((s: Record<string, unknown>) => s.isActive).map((s: Record<string, unknown>) => {
            const name = (s.user as Record<string, unknown>)?.name as string || '';
            const parts = name.split(' ');
            const initials = parts.map((w: string) => w[0]).join('').slice(0, 2);
            return (
              <Link key={s.id as string} href="/doctors" className="flex-shrink-0 w-[148px]">
                <div className="bg-bg-card rounded-lg p-5 text-center shadow-card
                  active:scale-[0.97] transition-transform">
                  <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center mx-auto mb-4">
                    <span className="text-md font-extrabold text-brand-dark">{initials}</span>
                  </div>
                  <p className="text-sm font-bold leading-snug">{parts.slice(0, 2).join(' ')}</p>
                  <p className="text-caption text-brand font-semibold mt-1">{s.specialty as string}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ══ Контакты ══ */}
      <div className="px-6 mb-16">
        <h2 className="text-h2 mb-5">Контакты</h2>
        <div className="bg-bg-card rounded-lg shadow-card overflow-hidden">
          <iframe
            src="https://yandex.ru/map-widget/v1/?ll=47.5049,42.9849&z=15&pt=47.5049,42.9849,pm2rdm"
            width="100%" height="200" frameBorder="0" style={{ border: 0, display: 'block' }} />
          <div className="p-6 space-y-5">
            <Row icon={MapPin} text="г. Махачкала, ул. Ярагского, 45" />
            <Row icon={Phone} text="+7 (8722) 12-34-56" href="tel:+78722123456" />
            <Row icon={Clock} text="Пн–Пт 9:00–19:00 · Сб 10:00–14:00" />
          </div>
        </div>
      </div>

      {/* ══ CTA ══ */}
      <div className="px-6 pb-8">
        <Link href="/price"
          className="flex items-center justify-center gap-2 bg-brand text-white w-full
          py-[18px] rounded-md text-md font-bold shadow-button
          active:scale-[0.98] transition-transform">
          Записаться на приём <ArrowRight size={17} />
        </Link>
      </div>

    </div>
  );
}

function Row({ icon: Icon, text, href }: { icon: React.ElementType; text: string; href?: string }) {
  const el = (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-sm bg-brand-subtle flex items-center justify-center flex-shrink-0">
        <Icon size={17} className="text-brand-dark" />
      </div>
      <p className="text-base font-medium">{text}</p>
    </div>
  );
  return href ? <a href={href}>{el}</a> : el;
}

function plural(n: number): string {
  const a = Math.abs(n) % 100, l = a % 10;
  if (a > 10 && a < 20) return 'услуг';
  if (l > 1 && l < 5) return 'услуги';
  if (l === 1) return 'услуга';
  return 'услуг';
}
