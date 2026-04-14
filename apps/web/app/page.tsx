'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowRight, Phone, MapPin, Clock, ChevronRight, Star, Shield, Heart } from 'lucide-react';
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

      {/* ══════ HERO с фото ══════ */}
      <section className="relative h-[420px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=600&fit=crop&q=80"
          alt="Dr. Osmanov Dental"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
          <p className="text-[11px] font-bold text-brand-muted tracking-[0.15em] uppercase mb-3">
            Стоматологическая клиника
          </p>
          <h1 className="text-[32px] font-extrabold text-white leading-[1.15] tracking-tight">
            Dr. Osmanov
          </h1>
          <p className="text-[15px] text-white/70 mt-3 leading-relaxed max-w-[280px]">
            Современная клиника с&nbsp;заботой о&nbsp;каждом пациенте
          </p>
          <div className="flex gap-3 mt-6">
            <Link href="/price"
              className="bg-brand text-white px-6 py-[14px] rounded-md text-[15px] font-bold
              shadow-button flex items-center gap-2 active:scale-[0.97] transition-transform">
              Записаться <ArrowRight size={16} />
            </Link>
            <a href="tel:+78722123456"
              className="bg-white/15 backdrop-blur-md text-white px-5 py-[14px] rounded-md
              text-[15px] font-semibold border border-white/20
              active:scale-[0.97] transition-transform">
              Позвонить
            </a>
          </div>
        </div>
      </section>

      {/* ══════ Преимущества (конверсия) ══════ */}
      <section className="px-6 mt-10">
        <div className="grid grid-cols-3 gap-3">
          <Advantage icon={Star} title="12 лет" sub="опыта" />
          <Advantage icon={Shield} title="5 000+" sub="пациентов" />
          <Advantage icon={Heart} title="98%" sub="довольны" />
        </div>
      </section>

      {/* ══════ Акции ══════ */}
      {promotions && promotions.length > 0 && (
        <section className="mt-12">
          <div className="px-6 flex items-baseline justify-between mb-5">
            <h2 className="text-h2">Акции</h2>
            <Link href="/promos" className="text-sm text-brand font-semibold flex items-center gap-0.5">
              Все <ChevronRight size={15} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide">
            {promotions.slice(0, 4).map((p: Record<string, unknown>) => (
              <Link key={p.id as string} href="/promos" className="flex-shrink-0 w-[260px]">
                <div className="bg-brand-subtle rounded-lg p-6 h-full relative">
                  {p.discount && (
                    <span className="absolute top-5 right-5 bg-status-red text-white text-[11px] font-extrabold
                      w-9 h-9 rounded-full flex items-center justify-center">
                      -{p.discount as number}%
                    </span>
                  )}
                  <p className="text-[11px] font-bold text-brand-dark tracking-wider uppercase mb-2">Акция</p>
                  <h3 className="text-[15px] font-bold pr-8 leading-snug">{p.title as string}</h3>
                  {p.description && (
                    <p className="text-sm text-ink-secondary mt-2 line-clamp-2">{p.description as string}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ══════ Цены и запись (bento preview) ══════ */}
      <section className="px-6 mt-12">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-h2">Цены и запись</h2>
          <Link href="/price" className="text-sm text-brand font-semibold flex items-center gap-0.5">
            Все <ChevronRight size={15} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {cats.map((cat, i) => {
            const n = (services || []).filter((s: Record<string, unknown>) => s.category === cat).length;
            const isWide = i === 0 || i === 3;
            return (
              <Link key={cat} href={`/price?cat=${encodeURIComponent(cat)}`}
                className={isWide ? 'col-span-2' : ''}>
                <div className={`bg-bg-card rounded-lg shadow-card active:scale-[0.98] transition-transform
                  ${isWide ? 'p-6 flex items-center justify-between' : 'p-5'}`}>
                  <div>
                    <p className="text-[15px] font-bold">{cat}</p>
                    <p className="text-sm text-ink-tertiary mt-1">{n} {plural(n)}</p>
                  </div>
                  <ChevronRight size={18} className="text-brand" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ══════ Врачи ══════ */}
      <section className="mt-12">
        <div className="px-6 flex items-baseline justify-between mb-5">
          <h2 className="text-h2">Врачи</h2>
          <Link href="/doctors" className="text-sm text-brand font-semibold flex items-center gap-0.5">
            Все <ChevronRight size={15} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide">
          {(staff || []).filter((s: Record<string, unknown>) => s.isActive).map((s: Record<string, unknown>) => {
            const name = (s.user as Record<string, unknown>)?.name as string || '';
            const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2);
            const shortName = name.split(' ').slice(0, 1).join('') + ' ' + (name.split(' ')[1]?.[0] || '') + '.';
            return (
              <Link key={s.id as string} href="/doctors" className="flex-shrink-0 w-[140px]">
                <div className="bg-bg-card rounded-lg shadow-card text-center p-5
                  active:scale-[0.97] transition-transform">
                  <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center mx-auto mb-3">
                    <span className="text-[15px] font-extrabold text-brand-dark">{initials}</span>
                  </div>
                  {/* Единый формат: Фамилия И. — всегда 1 строка */}
                  <p className="text-sm font-bold truncate">{shortName}</p>
                  <p className="text-[11px] text-brand font-semibold mt-1">{s.specialty as string}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ══════ Отзывы (конверсия) ══════ */}
      <section className="px-6 mt-12">
        <h2 className="text-h2 mb-5">Отзывы</h2>
        <div className="space-y-3">
          <Review name="Амина К." text="Отличная клиника! Врачи внимательные, всё объяснили. Лечила кариес безболезненно." rating={5} />
          <Review name="Руслан М." text="Делал чистку — результат превосходный. Приятная атмосфера, записался на следующий раз." rating={5} />
          <Review name="Патимат Г." text="Спасибо за профессионализм! Наконец-то нашла своего стоматолога." rating={5} />
        </div>
      </section>

      {/* ══════ Контакты ══════ */}
      <section className="px-6 mt-12">
        <h2 className="text-h2 mb-5">Контакты</h2>
        <div className="bg-bg-card rounded-lg shadow-card overflow-hidden">
          <iframe
            src="https://yandex.ru/map-widget/v1/?ll=47.5049,42.9849&z=15&pt=47.5049,42.9849,pm2rdm"
            width="100%" height="180" frameBorder="0" style={{ border: 0, display: 'block' }} />
          <div className="p-5 space-y-4">
            <InfoRow icon={MapPin} text="г. Махачкала, ул. Ярагского, 45" />
            <InfoRow icon={Phone} text="+7 (8722) 12-34-56" href="tel:+78722123456" />
            <InfoRow icon={Clock} text="Пн–Пт 9:00–19:00 · Сб 10:00–14:00" />
          </div>
        </div>
      </section>

      {/* ══════ CTA ══════ */}
      <section className="px-6 mt-12 pb-6">
        <Link href="/price"
          className="flex items-center justify-center gap-2 bg-brand text-white w-full
          py-4 rounded-md text-[15px] font-bold shadow-button active:scale-[0.98] transition-transform">
          Записаться на приём <ArrowRight size={16} />
        </Link>
        <p className="text-center text-sm text-ink-tertiary mt-3">
          Или позвоните: <a href="tel:+78722123456" className="text-brand font-semibold">+7 (8722) 12-34-56</a>
        </p>
      </section>

    </div>
  );
}

/* ── Компоненты ── */

function Advantage({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="bg-bg-card rounded-md shadow-card p-4 text-center">
      <Icon size={20} className="text-brand mx-auto mb-2" />
      <p className="text-[15px] font-extrabold">{title}</p>
      <p className="text-[11px] text-ink-tertiary mt-0.5">{sub}</p>
    </div>
  );
}

function Review({ name, text, rating }: { name: string; text: string; rating: number }) {
  return (
    <div className="bg-bg-card rounded-md shadow-card p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex">
          {Array.from({ length: rating }).map((_, i) => (
            <Star key={i} size={14} className="text-brand fill-brand" />
          ))}
        </div>
      </div>
      <p className="text-sm text-ink leading-relaxed">{text}</p>
      <p className="text-[11px] text-ink-tertiary font-semibold mt-3">{name}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, text, href }: { icon: React.ElementType; text: string; href?: string }) {
  const el = (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-sm bg-brand-subtle flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-brand-dark" />
      </div>
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
  return href ? <a href={href}>{el}</a> : el;
}

function plural(n: number): string {
  const a = Math.abs(n) % 100, l = a % 10;
  if (a > 10 && a < 20) return 'услуг';
  if (l > 1 && l < 5) return 'услуги';
  return l === 1 ? 'услуга' : 'услуг';
}
