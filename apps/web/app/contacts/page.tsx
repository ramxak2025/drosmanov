'use client';

import { MapPin, Phone, Clock, Mail } from 'lucide-react';

export default function ContactsPage() {
  return (
    <div className="px-6 pt-12 pb-8">
      <h1 className="text-h2">Контакты</h1>
      <p className="text-[15px] text-ink-secondary mt-2 mb-8">Ждём вас в нашей клинике</p>

      {/* Карта */}
      <div className="bg-bg-card rounded-lg shadow-card overflow-hidden">
        <iframe
          src="https://yandex.ru/map-widget/v1/?ll=47.5049,42.9849&z=15&pt=47.5049,42.9849,pm2rdm"
          width="100%" height="220" frameBorder="0" style={{ border: 0, display: 'block' }} />
      </div>

      {/* Контактная информация — 12px gap */}
      <div className="mt-6 stack">
        <InfoCard icon={MapPin} label="Адрес" value="г. Махачкала, ул. Ярагского, 45" />
        <InfoCard icon={Phone} label="Телефон" value="+7 (8722) 12-34-56" href="tel:+78722123456" />
        <InfoCard icon={Clock} label="Режим работы" value="Пн–Пт: 9:00–19:00 · Сб: 10:00–14:00" />
        <InfoCard icon={Mail} label="Email" value="info@drosmanov.ru" href="mailto:info@drosmanov.ru" />
      </div>

      {/* Соцсети */}
      <div className="mt-10">
        <h2 className="text-h3 mb-4">Мы в соцсетях</h2>
        <div className="flex flex-wrap gap-3">
          <SocialBtn label="WhatsApp" href="https://wa.me/78722123456" />
          <SocialBtn label="Telegram" href="https://t.me/drosmanov" />
          <SocialBtn label="Instagram" href="https://instagram.com/drosmanov" />
          <SocialBtn label="VK" href="https://vk.com/drosmanov" />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, href }: {
  icon: React.ElementType; label: string; value: string; href?: string;
}) {
  const inner = (
    <div className="bg-bg-card rounded-md shadow-card p-4 flex items-center gap-4">
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

function SocialBtn({ label, href }: { label: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="bg-bg-card shadow-card px-5 py-3 rounded-md text-sm font-semibold text-ink-secondary
      active:scale-95 transition-transform">
      {label}
    </a>
  );
}
