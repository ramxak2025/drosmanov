'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { useRequireAuth } from '@/lib/auth';
import api from '@/lib/api';

export default function CashPage() {
  useRequireAuth(['STAFF', 'OWNER']);
  const [appointmentId, setAppointmentId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'BONUS' | 'MIXED'>('CASH');
  const [bonusUsed, setBonusUsed] = useState('');
  const [receipt, setReceipt] = useState<Record<string, unknown> | null>(null);

  const pay = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/payments', {
        appointmentId, amount: parseFloat(amount), method,
        bonusUsed: bonusUsed ? parseFloat(bonusUsed) : 0,
      });
      const r = await api.get(`/payments/receipt/${data.data.id}`);
      return r.data.data;
    },
    onSuccess: (d) => setReceipt(d),
  });

  if (receipt) {
    return (
      <div className="px-6 pt-12 pb-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-status-green/15 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-status-green" />
          </div>
          <h1 className="text-h2">Оплата принята</h1>
        </div>

        <div className="bg-bg-card rounded-lg shadow-card p-6 stack-sm">
          <Row label="Чек" value={`#${receipt.receiptNumber}`} />
          <Row label="Пациент" value={receipt.patient as string} />
          <Row label="Услуга" value={receipt.service as string} />
          <Row label="Врач" value={receipt.doctor as string} />
          <Row label="Сумма" value={`${(receipt.amount as number).toLocaleString('ru')} ₽`} />
          <Row label="Метод" value={receipt.method as string} />
          {(receipt.bonusEarned as number) > 0 && <Row label="Бонусы +" value={String(receipt.bonusEarned)} />}
        </div>

        <button onClick={() => { setReceipt(null); setAppointmentId(''); setAmount(''); }}
          className="w-full mt-6 bg-brand text-white py-4 rounded-md text-[15px] font-bold shadow-button
            active:scale-[0.97] transition-transform">
          Новая оплата
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 pt-12 pb-8">
      <h1 className="text-h2">Касса</h1>
      <p className="text-[15px] text-ink-secondary mt-2 mb-8">Приём оплаты за услугу</p>

      <div className="stack">
        <Field label="ID записи" value={appointmentId} onChange={setAppointmentId} />
        <Field label="Сумма, ₽" type="number" value={amount} onChange={setAmount} />

        <div>
          <label className="text-[12px] text-ink-secondary font-semibold mb-2 block">Метод оплаты</label>
          <div className="grid grid-cols-4 gap-2">
            {(['CASH', 'CARD', 'BONUS', 'MIXED'] as const).map((m) => (
              <button key={m} onClick={() => setMethod(m)}
                className={`py-[10px] rounded-sm text-[11px] font-semibold transition-all
                  ${method === m ? 'bg-brand text-white shadow-button' : 'bg-bg-card shadow-soft text-ink-secondary'}`}>
                {{ CASH: 'Нал.', CARD: 'Карта', BONUS: 'Бонус', MIXED: 'Микс' }[m]}
              </button>
            ))}
          </div>
        </div>

        {(method === 'BONUS' || method === 'MIXED') && (
          <Field label="Бонусов к списанию" type="number" value={bonusUsed} onChange={setBonusUsed} />
        )}

        <button onClick={() => pay.mutate()}
          disabled={!appointmentId || !amount || pay.isPending}
          className="w-full bg-brand text-white py-4 rounded-md text-[15px] font-bold shadow-button
            active:scale-[0.97] transition-transform disabled:opacity-40">
          {pay.isPending ? 'Оплата...' : 'Провести оплату'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-[12px] text-ink-secondary font-semibold mb-2 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-[14px] rounded-md bg-bg-card text-[15px] shadow-soft outline-none
          focus:ring-2 focus:ring-brand/20" />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-xs text-ink-tertiary">{label}</span>
      <span className="text-sm font-semibold text-right">{value}</span>
    </div>
  );
}
