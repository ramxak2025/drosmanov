'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function InstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const dismissed = sessionStorage.getItem('install_banner_dismissed');

    if (isIos && !isStandalone && !dismissed) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    sessionStorage.setItem('install_banner_dismissed', '1');
    setShow(false);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 glass-card p-4 animate-slide-up max-w-[400px] mx-auto">
      <button onClick={dismiss} className="absolute top-2 right-2 p-1 text-text-secondary">
        <X size={18} />
      </button>
      <p className="text-sm font-medium pr-6">
        Добавьте на экран: нажмите{' '}
        <span className="inline-block">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline -mt-0.5">
            <path d="M12 5v14M5 12l7-7 7 7" />
          </svg>
        </span>
        {' '}внизу экрана, затем &laquo;На экран Домой&raquo;
      </p>
    </div>
  );
}
