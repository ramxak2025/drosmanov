'use client';

import { useState, useMemo, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, Clock, ArrowRight, Search, X } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

/**
 * Синонимы стоматологических услуг — позволяет искать по бытовым словам.
 * Ключ: синоним → значение: слова, по которым будет поиск в услугах.
 */
const SYNONYMS: Record<string, string[]> = {
  'зуб':         ['кариес', 'пульпит', 'пломб', 'удалени', 'лечени', 'реставрац', 'терапи'],
  'боль':        ['пульпит', 'удалени', 'лечени', 'анестези', 'обезболивани'],
  'болит':       ['пульпит', 'удалени', 'лечени', 'анестези'],
  'дырка':       ['кариес', 'пломб', 'реставрац'],
  'пломба':      ['кариес', 'пломб', 'реставрац', 'вкладк'],
  'чистка':      ['гигиен', 'ультразвук', 'air flow', 'снятие', 'полировк', 'профессиональн'],
  'отбеливание': ['отбелив', 'эстетик', 'виниры'],
  'выравнивание':['брекет', 'элайнер', 'ортодонт', 'исправлени', 'прикус'],
  'прикус':      ['брекет', 'элайнер', 'ортодонт'],
  'брекеты':     ['брекет', 'ортодонт'],
  'коронка':     ['коронк', 'протез', 'керамик', 'циркони'],
  'протез':      ['протез', 'коронк', 'съёмн', 'несъёмн'],
  'имплант':     ['имплант', 'имплантац'],
  'удаление':    ['удалени', 'хирурги', 'зуб мудрост'],
  'мудрости':    ['зуб мудрост', 'удалени', 'ретинированн'],
  'виниры':      ['виниры', 'эстетик', 'реставрац'],
  'десна':       ['пародонт', 'десн', 'гингивит', 'кровоточ'],
  'кровоточит':  ['пародонт', 'десн', 'гингивит'],
  'снимок':      ['рентген', 'снимок', 'КТ', 'панорамн', 'диагностик'],
  'рентген':     ['рентген', 'снимок', 'КТ', 'ОПТГ'],
  'осмотр':      ['осмотр', 'консультац', 'диагностик', 'первичн'],
  'консультация':['консультац', 'осмотр', 'первичн', 'диагностик'],
  'ребенок':     ['детск', 'молочн', 'герметизац', 'фтор', 'серебрени'],
  'детский':     ['детск', 'молочн', 'герметизац', 'фтор'],
  'запах':       ['гигиен', 'чистк', 'пародонт'],
  'белые':       ['отбелив', 'виниры', 'эстетик'],
  'красивые':    ['эстетик', 'виниры', 'отбелив', 'реставрац'],
  'дешево':      ['бесплатн', 'акци', 'скидк'],
  'недорого':    ['бесплатн', 'акци', 'скидк'],
};

/**
 * Визуальное представление раздела — цветной градиент + крупный эмодзи/SVG.
 * Без stock-фото людей. Элегантно, единообразно, гарантированно.
 */
const CAT_META: Record<string, { gradient: string; emoji: string }> = {
  'Терапия':     { gradient: 'from-[#5E8BBA] via-[#4A7399] to-[#2C4F70]', emoji: '🦷' },
  'Хирургия':    { gradient: 'from-[#A35565] via-[#8B3F4F] to-[#5F2C37]', emoji: '⚕️' },
  'Гигиена':     { gradient: 'from-[#4FA89B] via-[#358578] to-[#1F5A50]', emoji: '✨' },
  'Ортодонтия':  { gradient: 'from-[#8C6FBD] via-[#6F54A0] to-[#483976]', emoji: '😁' },
  'Имплантация': { gradient: 'from-[#5D6872] via-[#414B54] to-[#262E36]', emoji: '🔩' },
  'Эстетика':    { gradient: 'from-[#D4A374] via-[#B08754] to-[#7A5A38]', emoji: '💎' },
};

export default function PricePage() {
  return (
    <Suspense fallback={<div className="px-6 pt-12"><h1 className="text-h2">Цены</h1></div>}>
      <Content />
    </Suspense>
  );
}

function Content() {
  const sp = useSearchParams();
  const [openCat, setOpenCat] = useState<string | null>(sp.get('cat') || null);
  const [query, setQuery] = useState('');

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => { const { data } = await api.get('/services'); return data.data; },
  });

  const grouped: Record<string, Record<string, unknown>[]> = {};
  (services || []).forEach((s: Record<string, unknown>) => {
    const cat = s.category as string;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  });

  /** Интеллектуальный поиск с синонимами */
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !services) return null;

    // Расширяем запрос синонимами
    const expandedTerms: string[] = [q];
    for (const [synonym, targets] of Object.entries(SYNONYMS)) {
      if (q.includes(synonym.toLowerCase()) || synonym.toLowerCase().includes(q)) {
        expandedTerms.push(...targets);
      }
    }

    return (services as Record<string, unknown>[]).filter((s) => {
      const name = (s.name as string).toLowerCase();
      const desc = ((s.description as string) || '').toLowerCase();
      const cat = ((s.category as string) || '').toLowerCase();
      const haystack = `${name} ${desc} ${cat}`;

      return expandedTerms.some(term => haystack.includes(term.toLowerCase()));
    });
  }, [query, services]);

  /* ══ Список услуг выбранной категории ══ */
  if (openCat && grouped[openCat]) {
    const items = grouped[openCat];
    const meta = CAT_META[openCat];

    return (
      <div className="pb-8">
        {/* Hero категории — градиент с эмодзи */}
        <div className={`relative h-[200px] md:h-[360px] md:rounded-xl md:mx-4 md:mt-4 overflow-hidden
          bg-gradient-to-br ${meta?.gradient || 'from-brand to-brand-dark'}`}>
          {/* Крупный декоративный эмодзи */}
          <div className="absolute top-1/2 right-8 md:right-16 -translate-y-1/2 text-[120px] md:text-[200px] opacity-20 select-none">
            {meta?.emoji || '🦷'}
          </div>
          {/* Dark overlay для читаемости текста снизу */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <button onClick={() => setOpenCat(null)}
            className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/15 backdrop-blur-md
              flex items-center justify-center active:scale-95 transition-transform">
            <ChevronLeft size={18} className="text-white" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-6 md:pb-10">
            <p className="text-[10px] md:text-[11px] font-bold text-white/70 tracking-[0.2em] uppercase mb-2 md:mb-3">
              Раздел услуг
            </p>
            <h1 className="text-[28px] md:text-[52px] font-extrabold text-white tracking-tight leading-[1.05]">
              {openCat}
            </h1>
            <p className="text-sm md:text-[16px] text-white/75 mt-2 md:mt-4">
              {items.length} {plural(items.length)} · Нажмите на услугу для записи
            </p>
          </div>
        </div>

        {/* Услуги — flex gap для надёжного отступа */}
        <div className="px-6 mt-6 stack-lg md:grid md:grid-cols-2 md:gap-4 md:stack-none pb-2">
          {items.map((s) => (
            <Link key={s.id as string} href={`/booking?serviceId=${s.id}`}>
              <div className="bg-bg-card rounded-lg shadow-card p-5
                active:scale-[0.98] transition-transform">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-bold leading-snug">{s.name as string}</p>
                    {s.description && (
                      <p className="text-[13px] text-ink-secondary mt-2 leading-relaxed">{s.description as string}</p>
                    )}
                    <p className="text-[12px] text-ink-tertiary mt-3 flex items-center gap-1.5">
                      <Clock size={12} /> {s.duration as number} мин
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 pt-1">
                    <p className="text-[18px] font-extrabold text-brand whitespace-nowrap">
                      {(s.price as number) === 0
                        ? 'бесплатно'
                        : <>{(s.price as number).toLocaleString('ru')}&nbsp;<span className="text-[14px] text-brand-dark">₽</span></>
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1 mt-4 pt-4 border-t border-line text-sm text-brand font-bold">
                  Записаться <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  /* ══ Разделы — модные bento-карточки ══ */
  return (
    <div className="px-6 pt-12 pb-8">
      <h1 className="text-h2">Цены</h1>
      <p className="text-[15px] text-ink-secondary mt-2 mb-6">Выберите раздел или найдите услугу</p>

      {/* Поиск */}
      <div className="relative mb-8">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-disabled" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск: кариес, чистка, болит зуб..."
          className="w-full pl-11 pr-10 py-[14px] rounded-lg bg-bg-card text-[15px] shadow-soft outline-none
            focus:ring-2 focus:ring-brand/20 placeholder:text-ink-disabled"
        />
        {query && (
          <button onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-ink-disabled/20
              flex items-center justify-center active:scale-90">
            <X size={14} className="text-ink-secondary" />
          </button>
        )}
      </div>

      {/* Результаты поиска */}
      {searchResults !== null ? (
        <div>
          <p className="text-[12px] text-ink-tertiary font-semibold uppercase tracking-wider mb-4">
            {searchResults.length > 0
              ? `Найдено ${searchResults.length} ${plural(searchResults.length)}`
              : 'Ничего не найдено'}
          </p>
          {searchResults.length === 0 ? (
            <div className="text-center py-12">
              <Search size={32} className="text-ink-disabled mx-auto mb-4" />
              <p className="text-[15px] text-ink-tertiary">Попробуйте другой запрос</p>
              <p className="text-[13px] text-ink-disabled mt-1">Например: чистка, кариес, виниры</p>
            </div>
          ) : (
            <div className="stack md:grid md:grid-cols-2 md:gap-4 md:stack-none">
              {searchResults.map((s) => (
                <Link key={s.id as string} href={`/booking?serviceId=${s.id}`}>
                  <div className="bg-bg-card rounded-lg shadow-card p-5 active:scale-[0.98] transition-transform">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-brand tracking-[0.1em] uppercase">{s.category as string}</p>
                        <p className="text-[16px] font-bold leading-snug mt-1">{s.name as string}</p>
                        {s.description && (
                          <p className="text-[13px] text-ink-secondary mt-2 leading-relaxed">{String(s.description)}</p>
                        )}
                        <p className="text-[12px] text-ink-tertiary mt-3 flex items-center gap-1.5">
                          <Clock size={12} /> {s.duration as number} мин
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 pt-1">
                        <p className="text-[18px] font-extrabold text-brand whitespace-nowrap">
                          {(s.price as number) === 0
                            ? 'бесплатно'
                            : <>{(s.price as number).toLocaleString('ru')}&nbsp;<span className="text-[14px] text-brand-dark">₽</span></>
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-4 pt-4 border-t border-line text-sm text-brand font-bold">
                      Записаться <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
      <div className="stack-md md:grid md:grid-cols-3 md:gap-4 md:stack-none">
        {Object.keys(grouped).map((cat) => {
          const count = grouped[cat].length;
          const meta = CAT_META[cat];
          return (
            <button key={cat} onClick={() => setOpenCat(cat)} className="w-full text-left">
              <div className={`relative h-[140px] rounded-lg overflow-hidden shadow-card
                bg-gradient-to-br ${meta?.gradient || 'from-brand to-brand-dark'}
                active:scale-[0.98] transition-transform`}>
                {/* Декоративный эмодзи */}
                <div className="absolute top-1/2 right-4 -translate-y-1/2 text-[72px] opacity-20 select-none">
                  {meta?.emoji || '🦷'}
                </div>
                {/* Dark overlay слева для текста */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

                <div className="relative h-full flex flex-col justify-center px-6">
                  <p className="text-[10px] font-bold text-white/60 tracking-[0.2em] uppercase mb-2">
                    Раздел
                  </p>
                  <h3 className="text-[22px] font-extrabold text-white tracking-tight">{cat}</h3>
                  <p className="text-[13px] text-white/70 mt-1.5 flex items-center gap-1">
                    {count} {plural(count)}
                    <ArrowRight size={14} className="ml-1" />
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      )}
    </div>
  );
}

function plural(n: number): string {
  const a = Math.abs(n) % 100, l = a % 10;
  if (a > 10 && a < 20) return 'услуг';
  if (l > 1 && l < 5) return 'услуги';
  return l === 1 ? 'услуга' : 'услуг';
}
