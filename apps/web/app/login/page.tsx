'use client';

import { useState } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fmt = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (d.length <= 1) return '+7';
    let r = '+7';
    if (d.length > 1) r += ' (' + d.slice(1, 4);
    if (d.length > 4) r += ') ' + d.slice(4, 7);
    if (d.length > 7) r += '-' + d.slice(7, 9);
    if (d.length > 9) r += '-' + d.slice(9, 11);
    return r;
  };

  const rawPhone = () => '+7' + phone.replace(/\D/g, '').slice(1);

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const ep = mode === 'login' ? '/auth/login' : '/auth/register';
      const body: Record<string, string> = { phone: rawPhone(), password };
      if (mode === 'register' && name) body.name = name;
      const { data } = await api.post(ep, body);
      login(data.data.accessToken, data.data.user);
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-ink-secondary font-medium">
          <ArrowLeft size={18} /> На главную
        </Link>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-12">
        <div className="max-w-[360px] mx-auto w-full">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-xl bg-brand-light flex items-center justify-center mx-auto mb-4">
              <span className="text-h3 font-extrabold text-brand-dark">DO</span>
            </div>
            <h1 className="text-h2">Личный кабинет</h1>
            <p className="text-sm text-ink-secondary mt-2">
              {mode === 'login' ? 'Войдите в свой аккаунт' : 'Создайте аккаунт'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-brand-subtle rounded-md p-1 mb-8">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-3 rounded-sm text-sm font-semibold transition-all
                ${mode === 'login' ? 'bg-bg-card shadow-soft text-ink' : 'text-ink-secondary'}`}>
              Вход
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-3 rounded-sm text-sm font-semibold transition-all
                ${mode === 'register' ? 'bg-bg-card shadow-soft text-ink' : 'text-ink-secondary'}`}>
              Регистрация
            </button>
          </div>

          <div className="stack">
            {mode === 'register' && (
              <Field label="Ваше имя" value={name} onChange={setName} placeholder="Магомед Магомедов" />
            )}
            <Field label="Телефон" type="tel" value={phone} onChange={(v) => setPhone(fmt(v))} placeholder="+7 (900) 123-45-67" />
            <div className="relative">
              <Field
                label="Пароль"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder={mode === 'register' ? 'Минимум 4 символа' : 'Ваш пароль'}
                error={error}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-[38px] text-ink-disabled p-1">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              onClick={submit}
              disabled={loading || rawPhone().length !== 12 || password.length < 4}
              className="w-full bg-brand text-white py-4 rounded-md text-[15px] font-bold shadow-button
                active:scale-[0.97] transition-transform disabled:opacity-40 disabled:pointer-events-none mt-2"
            >
              {loading ? 'Подождите...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, error }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; error?: string;
}) {
  return (
    <div>
      <label className="text-[12px] text-ink-secondary font-semibold mb-2 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-[14px] rounded-md bg-bg-card text-[15px] text-ink
          placeholder:text-ink-disabled shadow-soft outline-none
          focus:ring-2 focus:ring-brand/20 transition-shadow
          ${error ? 'ring-2 ring-status-red/30' : ''}`}
      />
      {error && <p className="text-[12px] text-status-red mt-2 font-medium">{error}</p>}
    </div>
  );
}
