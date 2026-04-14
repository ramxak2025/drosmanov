'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, Mail } from 'lucide-react';

export default function ContactsPage() {
  return (
    <div className="pt-3 pb-6">
      <h1 className="text-[22px] font-bold mb-1">Контакты</h1>
      <p className="text-[13px] text-text-secondary mb-6">Ждём вас в нашей клинике</p>

      {/* Карта */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[20px] overflow-hidden border border-border/40 shadow-[0_1px_4px_rgba(0,0,0,0.03)] mb-5"
      >
        <iframe
          src="https://yandex.ru/map-widget/v1/?ll=47.5049,42.9849&z=15&pt=47.5049,42.9849,pm2rdm"
          width="100%" height="220" frameBorder="0" style={{ border: 0, display: 'block' }} />
      </motion.div>

      {/* Инфо */}
      <div className="space-y-3">
        <ContactRow icon={MapPin} title="Адрес" value="г. Махачкала, ул. Ярагского, 45" />
        <ContactRow icon={Phone} title="Телефон" value="+7 (8722) 12-34-56" href="tel:+78722123456" />
        <ContactRow icon={Clock} title="Режим работы" value="Пн-Пт: 9:00–19:00 &middot; Сб: 10:00–14:00" />
        <ContactRow icon={Mail} title="Email" value="info@drosmanov.ru" href="mailto:info@drosmanov.ru" />
      </div>

      {/* Соцсети */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-8"
      >
        <p className="text-[13px] font-semibold mb-3">Мы в соцсетях</p>
        <div className="flex gap-2 flex-wrap">
          <SocialChip label="WhatsApp" href="https://wa.me/78722123456" bg="bg-[#25D366]/[0.08] text-[#25D366]" />
          <SocialChip label="Telegram" href="https://t.me/drosmanov" bg="bg-[#2AABEE]/[0.08] text-[#2AABEE]" />
          <SocialChip label="Instagram" href="https://instagram.com/drosmanov" bg="bg-[#E4405F]/[0.08] text-[#E4405F]" />
          <SocialChip label="VK" href="https://vk.com/drosmanov" bg="bg-[#4C75A3]/[0.08] text-[#4C75A3]" />
        </div>
      </motion.div>
    </div>
  );
}

function ContactRow({ icon: Icon, title, value, href }: {
  icon: React.ElementType; title: string; value: string; href?: string;
}) {
  const inner = (
    <div className="flex items-center gap-4 bg-white rounded-[16px] border border-border/40 p-4
      shadow-[0_1px_3px_rgba(0,0,0,0.03)] active:scale-[0.99] transition-transform">
      <div className="w-10 h-10 rounded-[12px] bg-primary/[0.08] flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-primary" />
      </div>
      <div>
        <p className="text-[11px] text-text-secondary">{title}</p>
        <p className="text-[13px] font-medium mt-0.5" dangerouslySetInnerHTML={{ __html: value }} />
      </div>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : <div>{inner}</div>;
}

function SocialChip({ label, href, bg }: { label: string; href: string; bg: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className={`px-4 py-2.5 rounded-[12px] text-[12px] font-semibold ${bg} active:scale-95 transition-transform`}>
      {label}
    </a>
  );
}
