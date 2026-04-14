'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

export default function CashPage() {
  const [appointmentId, setAppointmentId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'BONUS' | 'MIXED'>('CASH');
  const [bonusUsed, setBonusUsed] = useState('');
  const [receipt, setReceipt] = useState<Record<string, unknown> | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/payments', {
        appointmentId,
        amount: parseFloat(amount),
        method,
        bonusUsed: bonusUsed ? parseFloat(bonusUsed) : 0,
      });
      const receiptData = await api.get(`/payments/receipt/${data.data.id}`);
      return receiptData.data.data;
    },
    onSuccess: (data) => setReceipt(data),
  });

  if (receipt) {
    return (
      <div className="pt-2">
        <div className="text-center mb-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
            <Check size={32} className="text-success" />
          </motion.div>
          <h2 className="text-xl font-bold">Оплата принята</h2>
        </div>
        <Card className="space-y-2 text-sm">
          <Row label="Чек" value={`#${receipt.receiptNumber}`} />
          <Row label="Пациент" value={receipt.patient as string} />
          <Row label="Услуга" value={receipt.service as string} />
          <Row label="Врач" value={receipt.doctor as string} />
          <Row label="Сумма" value={`${(receipt.amount as number).toLocaleString('ru')} \u20BD`} />
          <Row label="Метод" value={receipt.method as string} />
          {(receipt.bonusUsed as number) > 0 && <Row label="Бонусы списано" value={String(receipt.bonusUsed)} />}
          {(receipt.bonusEarned as number) > 0 && <Row label="Бонусы начислено" value={String(receipt.bonusEarned)} />}
        </Card>
        <Button size="lg" className="mt-4" onClick={() => { setReceipt(null); setAppointmentId(''); setAmount(''); }}>
          Новая оплата
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <h1 className="text-xl font-bold mb-4">Касса</h1>

      <div className="space-y-4">
        <Input label="ID записи" value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} placeholder="UUID записи" />
        <Input label="Сумма, \u20BD" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="3000" />

        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">Метод оплаты</label>
          <div className="grid grid-cols-4 gap-2">
            {(['CASH', 'CARD', 'BONUS', 'MIXED'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`py-2 rounded-2xl text-xs font-medium ${method === m ? 'bg-primary text-white' : 'bg-surface text-text-secondary'}`}
              >
                {{ CASH: 'Нал.', CARD: 'Карта', BONUS: 'Бонусы', MIXED: 'Микс' }[m]}
              </button>
            ))}
          </div>
        </div>

        {(method === 'BONUS' || method === 'MIXED') && (
          <Input label="Бонусов к списанию" type="number" value={bonusUsed} onChange={(e) => setBonusUsed(e.target.value)} placeholder="0" />
        )}

        <Button size="lg" loading={mutation.isPending} onClick={() => mutation.mutate()} disabled={!appointmentId || !amount}>
          Провести оплату
        </Button>

        {mutation.error && (
          <p className="text-sm text-error text-center">{(mutation.error as Error).message}</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
