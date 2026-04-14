'use client';

import { MapPin, Phone, Clock, Mail } from 'lucide-react';

export default function ContactsPage() {
  return (
    <div className="ds-section pt-8 pb-8">
      <h1 className="text-h2">Контакты</h1>
      <p className="text-base text-neutral-600 mt-2">Ждём вас в нашей клинике</p>

      {/* Map */}
      <div className="ds-card overflow-hidden mt-8">
        <iframe
          src="https://yandex.ru/map-widget/v1/?ll=47.5049,42.9849&z=15&pt=47.5049,42.9849,pm2rdm"
          width="100%" height="220" frameBorder="0" style={{ border: 0, display: 'block' }} />
      </div>

      {/* Info — 16px gap between rows */}
      <div className="space-y-4 mt-8">
        <ContactRow icon={MapPin} title="Адрес" value="г. Махачкала, ул. Ярагского, 45" />
        <ContactRow icon={Phone} title="Телефон" value="+7 (8722) 12-34-56" href="tel:+78722123456" />
        <ContactRow icon={Clock} title="Режим работы" value="Пн–Пт: 9:00–19:00 · Сб: 10:00–14:00" />
        <ContactRow icon={Mail} title="Email" value="info@drosmanov.ru" href="mailto:info@drosmanov.ru" />
      </div>

      {/* Social — 8px gap */}
      <div className="mt-12">
        <h2 className="text-h3 mb-4">Мы в соцсетях</h2>
        <div className="flex flex-wrap gap-2">
          <Social label="WhatsApp" href="https://wa.me/78722123456" />
          <Social label="Telegram" href="https://t.me/drosmanov" />
          <Social label="Instagram" href="https://instagram.com/drosmanov" />
          <Social label="VK" href="https://vk.com/drosmanov" />
        </div>
      </div>
    </div>
  );
}

function ContactRow({ icon: Icon, title, value, href }: {
  icon: React.ElementType; title: string; value: string; href?: string;
}) {
  const inner = (
    <div className="ds-card px-4 py-4 flex items-center gap-4 active:scale-[0.99] transition-transform">
      <div className="w-10 h-10 rounded-md bg-primary-light flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-primary" />
      </div>
      <div>
        <p className="text-xs text-neutral-400">{title}</p>
        <p className="text-base font-medium mt-1">{value}</p>
      </div>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}

function Social({ label, href }: { label: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="ds-chip ds-chip-inactive active:scale-95 transition-transform">
      {label}
    </a>
  );
}
