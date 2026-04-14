'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Phone, MapPin, Clock, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import api from '@/lib/api';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

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

  // Категории для быстрого доступа к ценам/записи
  const categories = [...new Set((services || []).map((s: Record<string, unknown>) => s.category as string))];

  return (
    <div className="-mx-4">

      {/* ═══ Hero ═══ */}
      <section className="relative px-6 pt-14 pb-12 bg-gradient-to-b from-primary/[0.06] to-transparent">
        <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
          <p className="text-[13px] font-medium text-primary tracking-wide uppercase mb-3">Стоматология</p>
          <h1 className="text-[32px] font-extrabold leading-[1.15] tracking-tight">
            Dr. Osmanov
          </h1>
          <p className="text-[15px] text-text-secondary mt-3 leading-relaxed max-w-[320px]">
            Современная клиника с&nbsp;заботой о&nbsp;каждом пациенте
          </p>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.15, duration: 0.5 }} className="flex gap-3 mt-8">
          <Link href="/price"
            className="bg-primary text-white px-7 py-[14px] rounded-[16px] text-[15px] font-semibold
            shadow-[0_8px_24px_rgba(201,169,110,0.3)] active:scale-[0.97] transition-transform
            flex items-center gap-2">
            Записаться <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
          <a href="tel:+78722123456"
            className="bg-white text-text px-6 py-[14px] rounded-[16px] text-[15px] font-medium
            border border-border/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]
            active:scale-[0.97] transition-transform">
            Позвонить
          </a>
        </motion.div>

        {/* Декор */}
        <div className="absolute right-0 top-8 w-32 h-32 rounded-full bg-primary/[0.04] -z-10" />
        <div className="absolute right-8 top-28 w-16 h-16 rounded-full bg-primary/[0.06] -z-10" />
      </section>

      {/* ═══ Акции (если есть) ═══ */}
      {promotions && promotions.length > 0 && (
        <section className="mt-2 mb-2">
          <div className="px-6 mb-4">
            <SectionTitle title="Акции" link="/promos" />
          </div>
          <div className="flex gap-3 overflow-x-auto px-6 pb-1 scrollbar-hide snap-x snap-mandatory">
            {promotions.slice(0, 5).map((p: Record<string, unknown>, i: number) => (
              <motion.div
                key={p.id as string}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className="flex-shrink-0 w-[260px] snap-start"
              >
                <div className="bg-gradient-to-br from-primary/[0.08] to-primary/[0.02] rounded-[20px] p-5 border border-primary/[0.08] h-full relative overflow-hidden">
                  {p.discount && (
                    <div className="absolute top-4 right-4 bg-[#E84D4D] text-white text-[11px] font-bold w-9 h-9 rounded-full flex items-center justify-center shadow-sm">
                      -{p.discount as number}%
                    </div>
                  )}
                  <Sparkles size={18} className="text-primary mb-3" />
                  <h3 className="font-semibold text-[14px] leading-snug pr-8">{p.title as string}</h3>
                  {p.description && (
                    <p className="text-[12px] text-text-secondary mt-2 line-clamp-2 leading-relaxed">{p.description as string}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ Категории услуг (цены = запись) ═══ */}
      <section className="px-6 mt-8">
        <SectionTitle title="Цены и запись" link="/price" />
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat, i) => {
            const count = (services || []).filter((s: Record<string, unknown>) => s.category === cat).length;
            return (
              <motion.div key={cat} {...fadeUp} transition={{ delay: 0.05 * i }}>
                <Link href={`/price?cat=${encodeURIComponent(cat)}`}>
                  <div className="bg-white rounded-[18px] border border-border/40 p-4 h-full
                    shadow-[0_1px_4px_rgba(0,0,0,0.03)]
                    active:scale-[0.97] active:shadow-none transition-all">
                    <p className="font-semibold text-[14px]">{cat}</p>
                    <p className="text-[12px] text-text-secondary mt-1">{count} {declension(count, ['услуга', 'услуги', 'услуг'])}</p>
                    <ChevronRight size={16} className="text-primary mt-3" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ═══ Врачи ═══ */}
      <section className="mt-10">
        <div className="px-6 mb-4">
          <SectionTitle title="Врачи" link="/doctors" />
        </div>
        <div className="flex gap-3 overflow-x-auto px-6 pb-1 scrollbar-hide snap-x snap-mandatory">
          {(staff || []).filter((s: Record<string, unknown>) => s.isActive).map((s: Record<string, unknown>, i: number) => {
            const name = (s.user as Record<string, unknown>)?.name as string || '';
            const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
            return (
              <motion.div key={s.id as string} {...fadeUp} transition={{ delay: i * 0.08 }}
                className="flex-shrink-0 w-[160px] snap-start">
                <Link href="/doctors">
                  <div className="bg-white rounded-[20px] border border-border/40 p-4 text-center
                    shadow-[0_1px_4px_rgba(0,0,0,0.03)] active:scale-[0.97] transition-transform">
                    <div className="w-14 h-14 rounded-full bg-primary/[0.08] flex items-center justify-center mx-auto mb-3">
                      <span className="text-[15px] font-bold text-primary">{initials}</span>
                    </div>
                    <p className="font-semibold text-[13px] leading-snug">{name.split(' ').slice(0, 2).join(' ')}</p>
                    <p className="text-[11px] text-primary font-medium mt-1">{s.specialty as string}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ═══ Контакты ═══ */}
      <section className="px-6 mt-10">
        <SectionTitle title="Контакты" link="/contacts" />
        <div className="bg-white rounded-[20px] border border-border/40 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          <div className="h-[180px]">
            <iframe
              src="https://yandex.ru/map-widget/v1/?ll=47.5049,42.9849&z=15&pt=47.5049,42.9849,pm2rdm"
              width="100%" height="180" frameBorder="0" style={{ border: 0, display: 'block' }} />
          </div>
          <div className="p-5 space-y-4">
            <InfoRow icon={MapPin} label="г. Махачкала, ул. Ярагского, 45" />
            <InfoRow icon={Phone} label="+7 (8722) 12-34-56" href="tel:+78722123456" />
            <InfoRow icon={Clock} label="Пн-Пт 9-19, Сб 10-14" />
          </div>
        </div>
      </section>

      {/* ═══ CTA Footer ═══ */}
      <section className="px-6 mt-10 pb-6">
        <Link href="/price"
          className="flex items-center justify-center gap-2 bg-primary text-white py-[16px] rounded-[18px]
          text-[15px] font-semibold shadow-[0_8px_24px_rgba(201,169,110,0.25)]
          active:scale-[0.98] transition-transform w-full">
          Записаться на приём
          <ArrowRight size={16} strokeWidth={2.5} />
        </Link>
      </section>

    </div>
  );
}

/* ─── Компоненты ─── */

function SectionTitle({ title, link }: { title: string; link?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-0">
      <h2 className="text-[18px] font-bold">{title}</h2>
      {link && (
        <Link href={link} className="text-[13px] text-primary font-medium flex items-center gap-0.5">
          Все <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, href }: { icon: React.ElementType; label: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-[10px] bg-primary/[0.08] flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-primary" />
      </div>
      <p className="text-[13px] font-medium">{label}</p>
    </div>
  );
  return href ? <a href={href}>{content}</a> : content;
}

function declension(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}
