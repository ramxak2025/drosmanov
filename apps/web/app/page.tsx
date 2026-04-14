'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Phone, MapPin, Clock, ChevronRight, Sparkles } from 'lucide-react';
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

  const grouped: Record<string, Record<string, unknown>[]> = {};
  (services || []).forEach((s: Record<string, unknown>) => {
    const cat = s.category as string;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  });

  return (
    <div className="space-y-10 -mx-4">

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/8 via-background to-primary/5 px-6 pt-12 pb-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-5">
            <span className="text-xl font-bold text-primary">DO</span>
          </div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">
            Dr. Osmanov
          </h1>
          <p className="text-base text-text-secondary mt-2 leading-relaxed max-w-[300px]">
            Современная стоматология с заботой о каждом пациенте
          </p>
          <div className="flex gap-3 mt-6">
            <Link href="/client/booking" className="bg-primary text-white px-6 py-3.5 rounded-2xl text-sm font-semibold shadow-lg shadow-primary/25 active:scale-[0.97] transition-transform">
              Записаться
            </Link>
            <a href="tel:+78722123456" className="bg-white/80 backdrop-blur text-text px-5 py-3.5 rounded-2xl text-sm font-medium border border-border/50 active:scale-[0.97] transition-transform">
              Позвонить
            </a>
          </div>
        </motion.div>

        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-primary/5" />
        <div className="absolute -right-5 bottom-0 w-24 h-24 rounded-full bg-primary/8" />
      </section>

      {/* ─── Promotions banner ─── */}
      {promotions && promotions.length > 0 && (
        <section className="px-4">
          <SectionHeader title="Акции" link="/promos" />
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
            {promotions.slice(0, 5).map((p: Record<string, unknown>, i: number) => (
              <motion.div
                key={p.id as string}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex-shrink-0 w-[280px] snap-start"
              >
                <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-5 border border-primary/10 h-full">
                  {p.discount && (
                    <div className="absolute top-4 right-4 bg-error text-white text-xs font-bold w-10 h-10 rounded-full flex items-center justify-center">
                      -{p.discount as number}%
                    </div>
                  )}
                  <Sparkles size={20} className="text-primary mb-2" />
                  <h3 className="font-semibold text-[15px] pr-10">{p.title as string}</h3>
                  {p.description && (
                    <p className="text-xs text-text-secondary mt-1.5 line-clamp-2">{p.description as string}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Doctors ─── */}
      <section className="px-4">
        <SectionHeader title="Наши врачи" link="/doctors" />
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
          {(staff || []).filter((s: Record<string, unknown>) => s.isActive).map((s: Record<string, unknown>, i: number) => (
            <motion.div
              key={s.id as string}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex-shrink-0 w-[200px] snap-start"
            >
              <div className="bg-surface/80 rounded-3xl p-4 border border-border/50 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-primary">
                    {((s.user as Record<string, unknown>)?.name as string || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <p className="font-semibold text-sm">{(s.user as Record<string, unknown>)?.name as string}</p>
                <p className="text-xs text-primary mt-0.5">{s.specialty as string}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Price list ─── */}
      <section className="px-4">
        <SectionHeader title="Прайс-лист" link="/price" />
        {Object.entries(grouped).slice(0, 3).map(([category, items]) => (
          <div key={category} className="mb-5">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2.5">{category}</h3>
            <div className="bg-surface/60 rounded-3xl border border-border/40 overflow-hidden divide-y divide-border/40">
              {items.map((s) => (
                <div key={s.id as string} className="flex justify-between items-center px-5 py-3.5">
                  <div>
                    <p className="text-[14px] font-medium">{s.name as string}</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">{s.duration as number} мин</p>
                  </div>
                  <span className="text-[14px] font-semibold text-primary tabular-nums">
                    {(s.price as number) === 0 ? 'бесплатно' : `${(s.price as number).toLocaleString('ru')} \u20BD`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <Link href="/price" className="flex items-center justify-center gap-1 text-sm text-primary font-medium py-2">
          Полный прайс-лист <ChevronRight size={16} />
        </Link>
      </section>

      {/* ─── Contacts ─── */}
      <section className="px-4">
        <SectionHeader title="Контакты" />
        <div className="bg-surface/60 rounded-3xl border border-border/40 overflow-hidden">
          {/* Yandex Map */}
          <div className="h-[200px] bg-border/30">
            <iframe
              src="https://yandex.ru/map-widget/v1/?um=constructor%3A..&source=constructor&ll=47.5049,42.9849&z=16&pt=47.5049,42.9849,pm2rdm"
              width="100%"
              height="200"
              frameBorder="0"
              style={{ border: 0 }}
              allowFullScreen
            />
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Адрес</p>
                <p className="text-sm font-medium">г. Махачкала, ул. Ярагского, 45</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Phone size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Телефон</p>
                <a href="tel:+78722123456" className="text-sm font-medium">+7 (8722) 12-34-56</a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Режим работы</p>
                <p className="text-sm font-medium">Пн-Пт: 9:00 — 19:00</p>
                <p className="text-sm font-medium">Сб: 10:00 — 14:00</p>
              </div>
            </div>

            {/* Social links */}
            <div className="flex gap-2 pt-1">
              <SocialButton label="WhatsApp" href="https://wa.me/78722123456" color="bg-[#25D366]/10 text-[#25D366]" />
              <SocialButton label="Telegram" href="https://t.me/drosmanov" color="bg-[#2AABEE]/10 text-[#2AABEE]" />
              <SocialButton label="Instagram" href="https://instagram.com/drosmanov" color="bg-[#E4405F]/10 text-[#E4405F]" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-4 pb-4">
        <Link href="/client/booking" className="block bg-primary text-white text-center py-4 rounded-3xl text-[15px] font-semibold shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform">
          Записаться на приём
        </Link>
      </section>

    </div>
  );
}

function SectionHeader({ title, link }: { title: string; link?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold">{title}</h2>
      {link && (
        <Link href={link} className="text-xs text-primary font-medium flex items-center gap-0.5">
          Все <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

function SocialButton({ label, href, color }: { label: string; href: string; color: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className={`px-4 py-2 rounded-2xl text-xs font-medium ${color} active:scale-95 transition-transform`}>
      {label}
    </a>
  );
}
