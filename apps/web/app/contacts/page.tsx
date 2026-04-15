'use client';

import { useQuery } from '@tanstack/react-query';
import { MapPin, Phone, Clock, Mail, Info } from 'lucide-react';
import api from '@/lib/api';

export default function ContactsPage() {
  const { data: s } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => { const { data } = await api.get('/settings'); return data.data; },
  });

  const mapLat = s?.mapLat || 42.9849;
  const mapLng = s?.mapLng || 47.5049;

  // Соцсети: показываем только те, у которых заполнен URL владельцем
  const allSocials = [
    { label: 'WhatsApp', url: s?.whatsapp,  color: '#25D366', icon: <WhatsAppIcon /> },
    { label: 'Telegram', url: s?.telegram,  color: '#2AABEE', icon: <TelegramIcon /> },
    { label: 'Max',      url: s?.facebook,  color: '#0088CC', icon: <MaxIcon /> },
    { label: 'VK',       url: s?.vk,        color: '#0077FF', icon: <VKIcon /> },
    { label: 'YouTube',  url: s?.youtube,   color: '#FF0000', icon: <YouTubeIcon /> },
    { label: 'Instagram*', url: s?.instagram, color: '#E4405F', icon: <InstagramIcon />, meta: true },
  ];
  const socials = allSocials.filter((x) => !!x.url);
  const hasMeta = socials.some((x) => x.meta);

  return (
    <div className="px-6 pt-12 pb-8">
      <h1 className="text-h2">Контакты</h1>
      <p className="text-[15px] text-ink-secondary mt-2 mb-8">Ждём вас в нашей клинике</p>

      {/* Карта */}
      <div className="bg-bg-card rounded-lg shadow-card overflow-hidden">
        <iframe
          src={`https://yandex.ru/map-widget/v1/?ll=${mapLng},${mapLat}&z=15&pt=${mapLng},${mapLat},pm2rdm`}
          width="100%" height="220" frameBorder="0" style={{ border: 0, display: 'block' }} />
      </div>

      {/* Контактная информация */}
      <div className="mt-6 stack md:grid md:grid-cols-2 md:gap-4 md:stack-none">
        <InfoCard icon={MapPin} label="Адрес" value={s?.address || 'г. Махачкала, ул. Ярагского, 45'} />
        <InfoCard icon={Phone} label="Телефон" value={s?.phone || '+7 (8722) 12-34-56'} href={`tel:${(s?.phone || '+78722123456').replace(/\D/g, '')}`} />
        <InfoCard icon={Clock} label="Режим работы" value={s?.workHours || 'Пн–Пт 9:00–19:00 · Сб 10:00–14:00'} />
        {s?.email && <InfoCard icon={Mail} label="Email" value={s.email} href={`mailto:${s.email}`} />}
      </div>

      {/* Соцсети */}
      {socials.length > 0 && (
        <div className="mt-10">
          <h2 className="text-h3 mb-5">Мы в соцсетях</h2>
          <div className="grid grid-cols-4 gap-3">
            {socials.map((soc) => (
              <SocialIcon key={soc.label} label={soc.label} href={soc.url as string} color={soc.color} icon={soc.icon} />
            ))}
          </div>

          {hasMeta && (
            <div className="mt-5 bg-brand-subtle/50 border border-line rounded-md p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-sm bg-ink-disabled/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Info size={14} className="text-ink-secondary" />
              </div>
              <p className="text-[11px] text-ink-secondary leading-relaxed">
                *&nbsp;Instagram принадлежит компании Meta&nbsp;Platforms&nbsp;Inc., признанной
                экстремистской организацией и&nbsp;запрещённой на&nbsp;территории&nbsp;РФ.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, href }: {
  icon: React.ElementType; label: string; value: string; href?: string;
}) {
  const inner = (
    <div className="bg-bg-card rounded-md shadow-card p-4 flex items-center gap-4
      active:scale-[0.99] transition-transform">
      <div className="w-11 h-11 rounded-md bg-brand-subtle flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-brand-dark" />
      </div>
      <div>
        <p className="text-[11px] text-ink-tertiary font-medium">{label}</p>
        <p className="text-sm font-semibold mt-1">{value}</p>
      </div>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}

function SocialIcon({ label, href, color, icon }: {
  label: string; href: string; color: string; icon: React.ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
      <div className="w-14 h-14 rounded-[16px] flex items-center justify-center shadow-soft"
        style={{ backgroundColor: `${color}14` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <span className="text-[11px] font-semibold text-ink-secondary text-center leading-tight">
        {label}
      </span>
    </a>
  );
}

function WhatsAppIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>;
}
function TelegramIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>;
}
function VKIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1.003-1.49-1.137-1.744-1.137-.356 0-.458.102-.458.593v1.576c0 .424-.135.678-1.253.678-1.845 0-3.893-1.118-5.335-3.2C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.86 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.27.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.848 1.32 1.558 1.473 2.049.17.49-.085.745-.576.745z"/></svg>;
}
function YouTubeIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
}
function InstagramIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.897 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.897-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>;
}
function MaxIcon() {
  // Мессенджер MAX — буква M в круге (брендовая)
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.5 17h-2v-6.09l-2.5 3.59-2.5-3.59V17h-2V7h2l2.5 3.86L14.5 7h2v10z"/>
    </svg>
  );
}
