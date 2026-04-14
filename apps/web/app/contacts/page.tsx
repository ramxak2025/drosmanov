'use client';

import { MapPin, Phone, Clock, Mail } from 'lucide-react';

export default function ContactsPage() {
  return (
    <div className="px-6 pt-10 pb-8">
      <h1 className="text-h2">Контакты</h1>
      <p className="text-base text-ink-secondary mt-2">Ждём вас в нашей клинике</p>

      {/* Map */}
      <div className="bg-bg-card rounded-lg shadow-card overflow-hidden mt-8">
        <iframe
          src="https://yandex.ru/map-widget/v1/?ll=47.5049,42.9849&z=15&pt=47.5049,42.9849,pm2rdm"
          width="100%" height="220" frameBorder="0" style={{ border: 0, display: 'block' }} />
      </div>

      {/* Info */}
      <div className="mt-6 space-y-3">
        <InfoCard icon={MapPin} label="Адрес" value="г. Махачкала, ул. Ярагского, 45" />
        <InfoCard icon={Phone} label="Телефон" value="+7 (8722) 12-34-56" href="tel:+78722123456" />
        <InfoCard icon={Clock} label="Режим работы" value="Пн–Пт: 9:00–19:00 · Сб: 10:00–14:00" />
        <InfoCard icon={Mail} label="Email" value="info@drosmanov.ru" href="mailto:info@drosmanov.ru" />
      </div>

      {/* Social */}
      <div className="mt-10">
        <h2 className="text-h3 mb-4">Мы в соцсетях</h2>
        <div className="flex flex-wrap gap-2">
          {['WhatsApp', 'Telegram', 'Instagram', 'VK'].map((s) => (
            <a key={s} href="#" target="_blank" rel="noopener noreferrer"
              className="bg-bg-card shadow-soft px-5 py-[10px] rounded-sm text-sm font-semibold text-ink-secondary
              active:scale-95 transition-transform">
              {s}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, href }: {
  icon: React.ElementType; label: string; value: string; href?: string;
}) {
  const inner = (
    <div className="bg-bg-card rounded-md shadow-card px-5 py-4 flex items-center gap-4
      active:scale-[0.99] transition-transform">
      <div className="w-10 h-10 rounded-sm bg-brand-subtle flex items-center justify-center flex-shrink-0">
        <Icon size={17} className="text-brand-dark" />
      </div>
      <div>
        <p className="text-xs text-ink-tertiary font-medium">{label}</p>
        <p className="text-base font-semibold mt-[2px]">{value}</p>
      </div>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}
