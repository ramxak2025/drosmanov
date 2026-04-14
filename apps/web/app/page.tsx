'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowRight, Phone, MapPin, Clock, ChevronRight, Star,
  Gift, Calendar, FileText, Bell, CreditCard, Heart, Shield, Award,
} from 'lucide-react';
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

      {/* ═══ Hero ═══ */}
      <section className="relative h-[460px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=700&fit=crop&q=85"
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/90" />

        <div className="relative h-full flex flex-col justify-end px-6 pb-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15
            px-3 py-1.5 rounded-full self-start mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
            <span className="text-[11px] font-semibold text-white/90 tracking-wide">Работаем сейчас</span>
          </div>
          <h1 className="text-[36px] font-extrabold text-white leading-[1.05] tracking-tight">
            Красивая улыбка<br />
            <span className="text-brand-muted">без боли</span>
          </h1>
          <p className="text-[15px] text-white/75 mt-4 leading-relaxed max-w-[300px]">
            Современная стоматология в&nbsp;Махачкале. Запись онлайн за&nbsp;2&nbsp;минуты
          </p>
          <div className="flex gap-3 mt-7">
            <Link href="/price"
              className="bg-brand text-white px-6 py-4 rounded-md text-[15px] font-bold
              shadow-button flex items-center gap-2 active:scale-[0.97] transition-transform">
              Записаться <ArrowRight size={16} />
            </Link>
            <a href="tel:+78722123456"
              className="bg-white/12 backdrop-blur-md text-white px-5 py-4 rounded-md
              text-[15px] font-semibold border border-white/20
              active:scale-[0.97] transition-transform flex items-center gap-2">
              <Phone size={16} /> Звонок
            </a>
          </div>
        </div>
      </section>

      {/* ═══ Преимущества ═══ */}
      <section className="px-6 mt-8">
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={Award} title="12 лет" sub="опыта" />
          <Stat icon={Heart} title="5 000+" sub="пациентов" />
          <Stat icon={Shield} title="98%" sub="довольны" />
        </div>
      </section>

      {/* ═══ Акции ═══ */}
      {promotions && promotions.length > 0 && (
        <section className="mt-14">
          <div className="px-6 flex items-baseline justify-between mb-5">
            <h2 className="text-h2">Акции</h2>
            <Link href="/promos" className="text-sm text-brand font-semibold flex items-center gap-0.5">
              Все <ChevronRight size={15} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide">
            {promotions.slice(0, 4).map((p: Record<string, unknown>) => (
              <Link key={p.id as string} href="/promos" className="flex-shrink-0 w-[270px]">
                <div className="bg-gradient-to-br from-brand-light to-brand-subtle rounded-lg p-6 h-full
                  relative border border-brand/10 overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-brand/10" />
                  {p.discount && (
                    <span className="absolute top-5 right-5 bg-status-red text-white text-[11px] font-extrabold
                      w-10 h-10 rounded-full flex items-center justify-center shadow-md">
                      -{p.discount as number}%
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-brand-dark tracking-[0.15em] uppercase">
                    Спецпредложение
                  </span>
                  <h3 className="text-[16px] font-extrabold pr-10 mt-3 leading-snug">{p.title as string}</h3>
                  {p.description && (
                    <p className="text-[13px] text-ink-secondary mt-2 line-clamp-2 relative z-10">{p.description as string}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══ Бонусная программа (NEW) ═══ */}
      <section className="px-6 mt-14">
        <div className="relative bg-gradient-to-br from-ink via-ink to-brand-dark rounded-xl p-7 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-brand/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-brand/10 blur-2xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full mb-5">
              <Gift size={12} className="text-brand-muted" />
              <span className="text-[10px] font-bold text-white/90 tracking-widest uppercase">Скоро запуск</span>
            </div>
            <h2 className="text-[24px] font-extrabold text-white leading-tight">
              Бонусная<br />программа
            </h2>
            <p className="text-[14px] text-white/70 mt-3 leading-relaxed max-w-[280px]">
              Получайте 5% с&nbsp;каждого визита и&nbsp;тратьте их&nbsp;на&nbsp;следующие услуги
            </p>
            <div className="grid grid-cols-3 gap-2 mt-6">
              <BonusStep n="1" t="Посещение" />
              <BonusStep n="2" t="Бонусы" />
              <BonusStep n="3" t="Скидка" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Цены и запись ═══ */}
      <section className="px-6 mt-14">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-h2">Цены и запись</h2>
          <Link href="/price" className="text-sm text-brand font-semibold flex items-center gap-0.5">
            Все <ChevronRight size={15} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {cats.slice(0, 6).map((cat) => {
            const n = (services || []).filter((s: Record<string, unknown>) => s.category === cat).length;
            return (
              <Link key={cat} href={`/price?cat=${encodeURIComponent(cat)}`}>
                <div className="bg-bg-card rounded-lg shadow-card p-5 h-full
                  active:scale-[0.97] transition-transform">
                  <p className="text-[15px] font-bold">{cat}</p>
                  <p className="text-[12px] text-ink-tertiary mt-1">{n} {plural(n)}</p>
                  <ChevronRight size={16} className="text-brand mt-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ═══ Врачи ═══ */}
      <section className="mt-14">
        <div className="px-6 flex items-baseline justify-between mb-5">
          <h2 className="text-h2">Врачи</h2>
          <Link href="/doctors" className="text-sm text-brand font-semibold flex items-center gap-0.5">
            Все <ChevronRight size={15} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide">
          {(staff || []).filter((s: Record<string, unknown>) => s.isActive).map((s: Record<string, unknown>) => {
            const name = (s.user as Record<string, unknown>)?.name as string || '';
            const parts = name.split(' ');
            const initials = parts.map((w: string) => w[0]).join('').slice(0, 2);
            const short = parts[0] + ' ' + (parts[1]?.[0] || '') + '.';
            return (
              <Link key={s.id as string} href="/doctors" className="flex-shrink-0 w-[144px]">
                <div className="bg-bg-card rounded-lg shadow-card p-5 text-center
                  active:scale-[0.97] transition-transform">
                  <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center mx-auto mb-3">
                    <span className="text-[15px] font-extrabold text-brand-dark">{initials}</span>
                  </div>
                  <p className="text-sm font-bold truncate">{short}</p>
                  <p className="text-[11px] text-brand font-semibold mt-1">{s.specialty as string}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ═══ Возможности после регистрации ═══ */}
      <section className="px-6 mt-14">
        <h2 className="text-h2 mb-2">Личный кабинет</h2>
        <p className="text-[14px] text-ink-secondary mb-6">Зарегистрируйтесь и&nbsp;получите доступ к&nbsp;возможностям</p>

        <div className="stack">
          <Feature icon={Calendar} title="Запись онлайн" text="Записывайтесь на приём в удобное время" />
          <Feature icon={FileText} title="История визитов" text="Все ваши приёмы и результаты в одном месте" />
          <Feature icon={CreditCard} title="Бонусный счёт" text="Копите и тратьте бонусы на услуги" />
          <Feature icon={Bell} title="Напоминания" text="Уведомления за день до записи" />
        </div>

        <Link href="/login"
          className="flex items-center justify-center gap-2 mt-6 bg-ink text-white py-4 rounded-md
            text-[15px] font-bold active:scale-[0.98] transition-transform">
          Создать аккаунт <ArrowRight size={16} />
        </Link>
      </section>

      {/* ═══ Отзывы ═══ */}
      <section className="px-6 mt-14">
        <h2 className="text-h2 mb-5">Отзывы</h2>
        <div className="stack">
          <Review name="Амина К." text="Отличная клиника! Врачи внимательные, всё объяснили. Лечила кариес безболезненно." />
          <Review name="Руслан М." text="Делал чистку — результат превосходный. Записался на следующий раз." />
          <Review name="Патимат Г." text="Спасибо за профессионализм! Наконец-то нашла своего стоматолога." />
        </div>
      </section>

      {/* ═══ Контакты ═══ */}
      <section className="px-6 mt-14">
        <h2 className="text-h2 mb-5">Контакты</h2>
        <div className="bg-bg-card rounded-lg shadow-card overflow-hidden">
          <iframe
            src="https://yandex.ru/map-widget/v1/?ll=47.5049,42.9849&z=15&pt=47.5049,42.9849,pm2rdm"
            width="100%" height="200" frameBorder="0" style={{ border: 0, display: 'block' }} />
          <div className="p-5 stack-md">
            <InfoRow icon={MapPin} text="г. Махачкала, ул. Ярагского, 45" />
            <InfoRow icon={Phone} text="+7 (8722) 12-34-56" href="tel:+78722123456" />
            <InfoRow icon={Clock} text="Пн–Пт 9:00–19:00 · Сб 10:00–14:00" />
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="px-6 mt-14 pb-6">
        <Link href="/price"
          className="flex items-center justify-center gap-2 bg-brand text-white w-full
          py-[18px] rounded-md text-[15px] font-bold shadow-button active:scale-[0.98] transition-transform">
          Записаться на приём <ArrowRight size={16} />
        </Link>
      </section>

    </div>
  );
}

/* ── Компоненты ── */

function Stat({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="bg-bg-card rounded-md shadow-card p-4 text-center">
      <Icon size={18} className="text-brand mx-auto mb-2" strokeWidth={2.2} />
      <p className="text-[15px] font-extrabold">{title}</p>
      <p className="text-[11px] text-ink-tertiary mt-0.5">{sub}</p>
    </div>
  );
}

function BonusStep({ n, t }: { n: string; t: string }) {
  return (
    <div className="bg-white/8 backdrop-blur-md rounded-md p-3 text-center">
      <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center mx-auto mb-1.5">
        <span className="text-[10px] font-extrabold text-white">{n}</span>
      </div>
      <p className="text-[11px] font-semibold text-white/90">{t}</p>
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

function Review({ name, text }: { name: string; text: string }) {
  return (
    <div className="bg-bg-card rounded-md shadow-card p-5">
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={13} className="text-brand fill-brand" />
        ))}
      </div>
      <p className="text-[14px] text-ink leading-relaxed">{text}</p>
      <p className="text-[12px] text-ink-tertiary font-semibold mt-3">{name}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, text, href }: { icon: React.ElementType; text: string; href?: string }) {
  const el = (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-sm bg-brand-subtle flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-brand-dark" />
      </div>
      <p className="text-[14px] font-medium">{text}</p>
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
