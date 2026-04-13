'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body: Record<string, string> = {
        phone: getRawPhone(),
        password,
      };
      if (mode === 'register' && name) body.name = name;

      const { data } = await api.post(endpoint, body);
      login(data.data.accessToken, data.data.user);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Ошибка входа');
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
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-primary">DO</span>
          </div>
          <h1 className="text-3xl font-bold text-primary mb-1">Dr. Osmanov</h1>
          <p className="text-text-secondary text-sm">Стоматологическая клиника</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-medium transition-all ${
              mode === 'login' ? 'bg-primary text-white shadow-md' : 'bg-surface text-text-secondary'
            }`}
          >
            Вход
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-medium transition-all ${
              mode === 'register' ? 'bg-primary text-white shadow-md' : 'bg-surface text-text-secondary'
            }`}
          >
            Регистрация
          </button>
        </div>

        <motion.div
          key={mode}
          initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {mode === 'register' && (
            <Input
              label="Ваше имя"
              placeholder="Иван Иванов"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          <Input
            label="Номер телефона"
            type="tel"
            placeholder="+7 (900) 123-45-67"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
          />

          <div className="relative">
            <Input
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              placeholder={mode === 'register' ? 'Минимум 4 символа' : 'Введите пароль'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-text-secondary p-1"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Button
            size="lg"
            loading={loading}
            onClick={handleSubmit}
            disabled={getRawPhone().length !== 12 || password.length < 4}
          >
            {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
