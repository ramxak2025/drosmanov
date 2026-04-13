'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 1) return '+7';
    let formatted = '+7';
    if (digits.length > 1) formatted += ' (' + digits.slice(1, 4);
    if (digits.length > 4) formatted += ') ' + digits.slice(4, 7);
    if (digits.length > 7) formatted += '-' + digits.slice(7, 9);
    if (digits.length > 9) formatted += '-' + digits.slice(9, 11);
    return formatted;
  };

  const getRawPhone = () => '+7' + phone.replace(/\D/g, '').slice(1);

  const sendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { phone: getRawPhone() });
      setStep('code');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Ошибка отправки кода');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', {
        phone: getRawPhone(),
        code,
        name: name || undefined,
      });
      login(data.data.accessToken, data.data.user);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-primary mb-2">Dr. Osmanov</h1>
          <p className="text-text-secondary">Стоматологическая клиника</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <Input
                label="Номер телефона"
                type="tel"
                placeholder="+7 (900) 123-45-67"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                error={error}
              />
              <Input
                label="Ваше имя (при первом входе)"
                placeholder="Иван Иванов"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button
                size="lg"
                loading={loading}
                onClick={sendOtp}
                disabled={getRawPhone().length !== 12}
              >
                Получить код
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <p className="text-sm text-text-secondary text-center">
                Код отправлен на {phone}
              </p>
              <Input
                label="Код из SMS"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="1234"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                error={error}
                autoFocus
              />
              <Button size="lg" loading={loading} onClick={verifyOtp} disabled={code.length !== 4}>
                Войти
              </Button>
              <button
                className="w-full text-sm text-text-secondary underline"
                onClick={() => { setStep('phone'); setCode(''); setError(''); }}
              >
                Изменить номер
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
