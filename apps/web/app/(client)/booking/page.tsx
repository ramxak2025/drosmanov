'use client';

import { useState, useReducer } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

type Step = 'service' | 'doctor' | 'date' | 'time' | 'confirm';

interface BookingState {
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  staffId: string;
  staffName: string;
  date: string;
  slot: { start: string; end: string } | null;
  notes: string;
}

type Action =
  | { type: 'SET_SERVICE'; payload: { id: string; name: string; price: number; duration: number } }
  | { type: 'SET_STAFF'; payload: { id: string; name: string } }
  | { type: 'SET_DATE'; payload: string }
  | { type: 'SET_SLOT'; payload: { start: string; end: string } }
  | { type: 'SET_NOTES'; payload: string };

function reducer(state: BookingState, action: Action): BookingState {
  switch (action.type) {
    case 'SET_SERVICE':
      return { ...state, serviceId: action.payload.id, serviceName: action.payload.name, servicePrice: action.payload.price, serviceDuration: action.payload.duration };
    case 'SET_STAFF':
      return { ...state, staffId: action.payload.id, staffName: action.payload.name };
    case 'SET_DATE':
      return { ...state, date: action.payload, slot: null };
    case 'SET_SLOT':
      return { ...state, slot: action.payload };
    case 'SET_NOTES':
      return { ...state, notes: action.payload };
    default:
      return state;
  }
}

const initialState: BookingState = {
  serviceId: '', serviceName: '', servicePrice: 0, serviceDuration: 0,
  staffId: '', staffName: '', date: '', slot: null, notes: '',
};

const STEPS: Step[] = ['service', 'doctor', 'date', 'time', 'confirm'];

export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('service');
  const [state, dispatch] = useReducer(reducer, initialState);
  const [done, setDone] = useState(false);
  const stepIndex = STEPS.indexOf(step);

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => { const { data } = await api.get('/services'); return data.data; },
  });

  const { data: staffList } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => { const { data } = await api.get('/staff'); return data.data; },
  });

  const { data: slots } = useQuery({
    queryKey: ['slots', state.staffId, state.date, state.serviceId],
    queryFn: async () => {
      const { data } = await api.get('/appointments/slots', {
        params: { staffId: state.staffId, date: state.date, serviceId: state.serviceId },
      });
      return data.data;
    },
    enabled: !!state.staffId && !!state.date && !!state.serviceId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const dateObj = new Date(state.date);
      const [sh, sm] = state.slot!.start.split(':').map(Number);
      const [eh, em] = state.slot!.end.split(':').map(Number);
      const startTime = new Date(dateObj); startTime.setHours(sh, sm, 0, 0);
      const endTime = new Date(dateObj); endTime.setHours(eh, em, 0, 0);
      await api.post('/appointments', {
        staffId: state.staffId, serviceId: state.serviceId,
        startTime: startTime.toISOString(), endTime: endTime.toISOString(),
        notes: state.notes || undefined,
      });
    },
    onSuccess: () => setDone(true),
  });

  const next = () => { if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1]); };
  const back = () => { if (stepIndex > 0) setStep(STEPS[stepIndex - 1]); };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
          <Check size={32} className="text-success" />
        </motion.div>
        <h2 className="text-xl font-bold mb-2">Записаны!</h2>
        <p className="text-text-secondary mb-6">{state.serviceName}, {state.date}, {state.slot?.start}</p>
        <Button onClick={() => router.push('/client/visits')}>Мои визиты</Button>
      </div>
    );
  }

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="pt-2">
      <div className="flex items-center gap-3 mb-6">
        {stepIndex > 0 && (
          <button onClick={back} className="p-1"><ChevronLeft size={24} /></button>
        )}
        <h1 className="text-xl font-bold flex-1">Запись на приём</h1>
        <span className="text-sm text-text-secondary">{stepIndex + 1}/{STEPS.length}</span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-6">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= stepIndex ? 'bg-primary' : 'bg-border'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 'service' && (
          <StepWrap key="service">
            <h2 className="font-semibold mb-3">Выберите услугу</h2>
            <div className="space-y-2">
              {services?.map((s: Record<string, unknown>) => (
                <Card key={s.id as string} onClick={() => { dispatch({ type: 'SET_SERVICE', payload: { id: s.id as string, name: s.name as string, price: s.price as number, duration: s.duration as number } }); next(); }}
                  className={state.serviceId === s.id ? 'ring-2 ring-primary' : ''}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{s.name as string}</p>
                      <p className="text-sm text-text-secondary">{s.duration as number} мин</p>
                    </div>
                    <span className="font-semibold text-primary">{(s.price as number).toLocaleString('ru')} &#8381;</span>
                  </div>
                </Card>
              ))}
            </div>
          </StepWrap>
        )}

        {step === 'doctor' && (
          <StepWrap key="doctor">
            <h2 className="font-semibold mb-3">Выберите врача</h2>
            <div className="space-y-2">
              {staffList?.map((s: Record<string, unknown>) => (
                <Card key={s.id as string} onClick={() => { dispatch({ type: 'SET_STAFF', payload: { id: s.id as string, name: (s.user as Record<string, unknown>)?.name as string } }); next(); }}
                  className={state.staffId === s.id ? 'ring-2 ring-primary' : ''}>
                  <p className="font-medium">{(s.user as Record<string, unknown>)?.name as string}</p>
                  <p className="text-sm text-text-secondary">{s.specialty as string}</p>
                </Card>
              ))}
            </div>
          </StepWrap>
        )}

        {step === 'date' && (
          <StepWrap key="date">
            <h2 className="font-semibold mb-3">Выберите дату</h2>
            <div className="grid grid-cols-3 gap-2">
              {dates.map((d) => {
                const dateObj = new Date(d);
                return (
                  <Card key={d} onClick={() => { dispatch({ type: 'SET_DATE', payload: d }); next(); }}
                    className={`text-center py-3 ${state.date === d ? 'ring-2 ring-primary' : ''}`}>
                    <p className="text-xs text-text-secondary">{dateObj.toLocaleDateString('ru-RU', { weekday: 'short' })}</p>
                    <p className="font-semibold">{dateObj.getDate()}</p>
                    <p className="text-xs text-text-secondary">{dateObj.toLocaleDateString('ru-RU', { month: 'short' })}</p>
                  </Card>
                );
              })}
            </div>
          </StepWrap>
        )}

        {step === 'time' && (
          <StepWrap key="time">
            <h2 className="font-semibold mb-3">Выберите время</h2>
            {!slots || slots.length === 0 ? (
              <p className="text-text-secondary text-center py-8">Нет доступных слотов на эту дату</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot: { start: string; end: string }) => (
                  <Card key={slot.start} onClick={() => { dispatch({ type: 'SET_SLOT', payload: slot }); next(); }}
                    className={`text-center py-3 ${state.slot?.start === slot.start ? 'ring-2 ring-primary' : ''}`}>
                    <p className="font-semibold">{slot.start}</p>
                  </Card>
                ))}
              </div>
            )}
          </StepWrap>
        )}

        {step === 'confirm' && (
          <StepWrap key="confirm">
            <h2 className="font-semibold mb-4">Подтверждение</h2>
            <Card className="space-y-3 mb-4">
              <Row label="Услуга" value={state.serviceName} />
              <Row label="Врач" value={state.staffName} />
              <Row label="Дата" value={new Date(state.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <Row label="Время" value={`${state.slot?.start} — ${state.slot?.end}`} />
              <Row label="Стоимость" value={`${state.servicePrice.toLocaleString('ru')} \u20BD`} />
            </Card>
            <textarea
              className="w-full p-3 rounded-2xl bg-surface border border-border text-sm resize-none"
              rows={2}
              placeholder="Комментарий (необязательно)"
              value={state.notes}
              onChange={(e) => dispatch({ type: 'SET_NOTES', payload: e.target.value })}
            />
            <Button size="lg" loading={createMutation.isPending} onClick={() => createMutation.mutate()} className="mt-4">
              Подтвердить запись
            </Button>
          </StepWrap>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
      {children}
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-secondary text-sm">{label}</span>
      <span className="font-medium text-sm">{value}</span>
    </div>
  );
}
