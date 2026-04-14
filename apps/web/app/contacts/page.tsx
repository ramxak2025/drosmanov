'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, Mail, MessageCircle } from 'lucide-react';

export default function ContactsPage() {
  return (
    <div className="pt-2 pb-4">
      <h1 className="text-xl font-bold mb-1">Контакты</h1>
      <p className="text-sm text-text-secondary mb-6">Ждём вас в нашей клинике</p>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl overflow-hidden border border-border/40 mb-6"
      >
        <div className="h-[250px]">
          <iframe
            src="https://yandex.ru/map-widget/v1/?um=constructor%3A..&source=constructor&ll=47.5049,42.9849&z=16&pt=47.5049,42.9849,pm2rdm"
            width="100%"
            height="250"
            frameBorder="0"
            style={{ border: 0 }}
            allowFullScreen
          />
        </div>
      </motion.div>

      {/* Info cards */}
      <div className="space-y-3">
        <ContactCard
          icon={MapPin}
          title="Адрес"
          lines={['г. Махачкала', 'ул. Ярагского, 45']}
        />
        <ContactCard
          icon={Phone}
          title="Телефон"
          lines={['+7 (8722) 12-34-56']}
          href="tel:+78722123456"
        />
        <ContactCard
          icon={Clock}
          title="Режим работы"
          lines={['Пн-Пт: 9:00 — 19:00', 'Сб: 10:00 — 14:00', 'Вс: выходной']}
        />
        <ContactCard
          icon={Mail}
          title="Email"
          lines={['info@drosmanov.ru']}
          href="mailto:info@drosmanov.ru"
        />
      </div>

      {/* Social */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <h2 className="text-sm font-semibold mb-3">Мы в соцсетях</h2>
        <div className="flex gap-2">
          <SocialPill label="WhatsApp" href="https://wa.me/78722123456" emoji="💬" bg="bg-[#25D366]/10" />
          <SocialPill label="Telegram" href="https://t.me/drosmanov" emoji="✈️" bg="bg-[#2AABEE]/10" />
          <SocialPill label="Instagram" href="https://instagram.com/drosmanov" emoji="📸" bg="bg-[#E4405F]/10" />
          <SocialPill label="VK" href="https://vk.com/drosmanov" emoji="💎" bg="bg-[#4C75A3]/10" />
        </div>
      </motion.div>
    </div>
  );
}

function ContactCard({ icon: Icon, title, lines, href }: {
  icon: React.ElementType; title: string; lines: string[]; href?: string;
}) {
  const Wrapper = href ? 'a' : 'div';
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
      <Wrapper {...(href ? { href } : {})} className="flex items-start gap-4 bg-surface/60 rounded-2xl border border-border/40 p-4 active:scale-[0.99] transition-transform">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon size={20} className="text-primary" />
        </div>
        <div>
          <p className="text-xs text-text-secondary mb-0.5">{title}</p>
          {lines.map((line, i) => (
            <p key={i} className="text-sm font-medium">{line}</p>
          ))}
        </div>
      </Wrapper>
    </motion.div>
  );
}

function SocialPill({ label, href, emoji, bg }: { label: string; href: string; emoji: string; bg: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-medium ${bg} active:scale-95 transition-transform`}>
      <span>{emoji}</span> {label}
    </a>
  );
}
