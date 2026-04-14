'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar, Sparkles, ArrowRight, Gift } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function PromosPage() {
  const { data: promotions } = useQuery({
    queryKey: ['promos'],
    queryFn: async () => { const { data } = await api.get('/promotions'); return data.data; },
  });

  return (
    <div className="pb-8">
      {/* Hero заголовок */}
      <div className="px-6 pt-12 mb-8">
        <p className="text-[11px] font-bold text-brand tracking-[0.15em] uppercase mb-3 flex items-center gap-2">
          <Sparkles size={12} /> Специальные предложения
        </p>
        <h1 className="text-h1">Акции</h1>
        <p className="text-[15px] text-ink-secondary mt-3 leading-relaxed max-w-[280px]">
          Актуальные скидки и&nbsp;выгодные предложения клиники
        </p>
      </div>

      {(!promotions || promotions.length === 0) ? (
        <div className="px-6 text-center py-20">
          <Gift size={32} className="text-ink-disabled mx-auto mb-4" />
          <p className="text-[15px] text-ink-tertiary">Нет активных акций</p>
        </div>
      ) : (
        <div className="px-6 stack-md">
          {promotions.map((p: Record<string, unknown>, i: number) => (
            <PromoCard key={p.id as string} promo={p} index={i} />
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="px-6 mt-12">
        <Link href="/price"
          className="flex items-center justify-center gap-2 bg-brand text-white w-full
            py-4 rounded-md text-[15px] font-bold shadow-button active:scale-[0.97] transition-transform">
          Записаться на приём <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

function PromoCard({ promo, index }: { promo: Record<string, unknown>; index: number }) {
  const endDate = new Date(promo.endDate as string);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;

  return (
    <div className="bg-bg-card rounded-xl shadow-card overflow-hidden">
      {/* Фото баннер или градиент */}
      {promo.photoPath ? (
        <div className="aspect-[16/9] relative">
          <img src={`/api/uploads/${promo.photoPath}`} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          {promo.discount ? (
            <div className="absolute top-4 right-4">
              <div className="bg-white text-[#D14343] font-extrabold text-[16px] px-3 py-1.5 rounded-md shadow-lg">
                −{promo.discount as number}%
              </div>
            </div>
          ) : null}
          {isExpiringSoon && (
            <div className="absolute top-4 left-4">
              <div className="bg-white/90 backdrop-blur-md text-[#D14343] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                🔥 Скоро закончится
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-[16/9] relative bg-gradient-to-br from-brand-light via-brand-subtle to-brand-muted/30 flex items-center justify-center">
          <Sparkles size={48} className="text-brand/40" />
          {promo.discount ? (
            <div className="absolute top-4 right-4">
              <div className="bg-[#D14343] text-white font-extrabold text-[16px] px-3 py-1.5 rounded-md shadow-lg">
                −{promo.discount as number}%
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Контент */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-brand" />
          <p className="text-[10px] font-bold text-brand tracking-[0.15em] uppercase">
            Акция №{index + 1}
          </p>
        </div>

        <h3 className="text-[20px] font-extrabold leading-tight tracking-tight">{promo.title as string}</h3>

        {promo.description ? (
          <p className="text-[14px] text-ink-secondary mt-3 leading-relaxed">{promo.description as string}</p>
        ) : null}

        {/* Даты */}
        <div className="flex items-center gap-5 mt-5 pt-5 border-t border-line">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-ink-tertiary" />
            <div>
              <p className="text-[10px] text-ink-tertiary font-semibold uppercase tracking-wide">До</p>
              <p className="text-[12px] font-bold">
                {endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          {daysLeft > 0 && (
            <div>
              <p className="text-[10px] text-ink-tertiary font-semibold uppercase tracking-wide">Осталось</p>
              <p className={`text-[12px] font-bold ${isExpiringSoon ? 'text-[#D14343]' : 'text-ink'}`}>
                {daysLeft} {plural(daysLeft, ['день', 'дня', 'дней'])}
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <Link href="/price"
          className="mt-6 flex items-center justify-center gap-2 bg-ink text-white w-full
            py-3 rounded-md text-[14px] font-bold active:scale-[0.97] transition-transform">
          Записаться <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100, l = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (l > 1 && l < 5) return forms[1];
  return l === 1 ? forms[0] : forms[2];
}
