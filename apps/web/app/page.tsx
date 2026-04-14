'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowRight, Phone, MapPin, Clock, ChevronRight } from 'lucide-react';
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

  const categories = [...new Set((services || []).map((s: Record<string, unknown>) => s.category as string))];

  return (
    <div>

      {/* ════ Hero ════ */}
      <section className="ds-section pt-16 pb-16 bg-primary-subtle">
        <p className="text-sm font-semibold text-primary tracking-wide uppercase mb-4">Стоматология</p>
        <h1 className="text-h1">Dr. Osmanov</h1>
        <p className="text-lg text-neutral-600 mt-4 max-w-[320px]">
          Современная клиника с&nbsp;заботой о&nbsp;каждом пациенте
        </p>
        <div className="flex gap-4 mt-8">
          <Link href="/price" className="ds-btn">
            Записаться <ArrowRight size={18} />
          </Link>
          <a href="tel:+78722123456" className="ds-btn-secondary">Позвонить</a>
        </div>
      </section>

      {/* ════ Акции ════ */}
      {promotions && promotions.length > 0 && (
        <section className="ds-section mt-16">
          <SectionHead title="Акции" href="/promos" />
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide mt-6">
            {promotions.slice(0, 5).map((p: Record<string, unknown>) => (
              <div key={p.id as string} className="flex-shrink-0 w-[264px]">
                <div className="ds-card p-6 h-full relative bg-primary-subtle border-primary/10">
                  {p.discount && (
                    <div className="absolute top-4 right-4 bg-accent-red text-neutral-0 text-xs font-bold w-10 h-10 rounded-full flex items-center justify-center">
                      -{p.discount as number}%
                    </div>
                  )}
                  <h3 className="text-h3 pr-10">{p.title as string}</h3>
                  {p.description && (
                    <p className="text-sm text-neutral-600 mt-2 line-clamp-2">{p.description as string}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ════ Категории (Цены и запись) ════ */}
      <section className="ds-section mt-16">
        <SectionHead title="Цены и запись" href="/price" />
        <div className="grid grid-cols-2 gap-4 mt-6">
          {categories.map((cat) => {
            const count = (services || []).filter((s: Record<string, unknown>) => s.category === cat).length;
            return (
              <Link key={cat} href={`/price?cat=${encodeURIComponent(cat)}`}>
                <div className="ds-card p-6 h-full active:scale-[0.97] transition-transform">
                  <h3 className="text-base font-semibold">{cat}</h3>
                  <p className="text-sm text-neutral-400 mt-2">{count} {plural(count)}</p>
                  <ChevronRight size={18} className="text-primary mt-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ════ Врачи ════ */}
      <section className="mt-16">
        <div className="ds-section">
          <SectionHead title="Врачи" href="/doctors" />
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide mt-6">
          {(staff || []).filter((s: Record<string, unknown>) => s.isActive).map((s: Record<string, unknown>) => {
            const name = (s.user as Record<string, unknown>)?.name as string || '';
            const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2);
            return (
              <Link key={s.id as string} href="/doctors" className="flex-shrink-0 w-[160px]">
                <div className="ds-card p-6 text-center active:scale-[0.97] transition-transform">
                  <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
                    <span className="text-base font-bold text-primary">{initials}</span>
                  </div>
                  <p className="text-sm font-semibold leading-snug">{name.split(' ').slice(0, 2).join(' ')}</p>
                  <p className="text-xs text-primary font-medium mt-1">{s.specialty as string}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ════ Контакты ════ */}
      <section className="ds-section mt-16">
        <SectionHead title="Контакты" href="/contacts" />
        <div className="ds-card overflow-hidden mt-6">
          <div className="h-[200px]">
            <iframe
              src="https://yandex.ru/map-widget/v1/?ll=47.5049,42.9849&z=15&pt=47.5049,42.9849,pm2rdm"
              width="100%" height="200" frameBorder="0" style={{ border: 0, display: 'block' }} />
          </div>
          <div className="p-6 space-y-6">
            <InfoRow icon={MapPin} text="г. Махачкала, ул. Ярагского, 45" />
            <InfoRow icon={Phone} text="+7 (8722) 12-34-56" href="tel:+78722123456" />
            <InfoRow icon={Clock} text="Пн–Пт 9:00–19:00, Сб 10:00–14:00" />
          </div>
        </div>
      </section>

      {/* ════ CTA ════ */}
      <section className="ds-section mt-16 pb-8">
        <Link href="/price" className="ds-btn w-full">
          Записаться на приём <ArrowRight size={18} />
        </Link>
      </section>

    </div>
  );
}

/* ── Повторяемые компоненты ── */

function SectionHead({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-h2">{title}</h2>
      {href && (
        <Link href={href} className="text-sm text-primary font-medium flex items-center gap-1">
          Все <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, text, href }: { icon: React.ElementType; text: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-md bg-primary-light flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-primary" />
      </div>
      <p className="text-base font-medium">{text}</p>
    </div>
  );
  return href ? <a href={href}>{content}</a> : content;
}

function plural(n: number): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return 'услуг';
  if (last > 1 && last < 5) return 'услуги';
  if (last === 1) return 'услуга';
  return 'услуг';
}
