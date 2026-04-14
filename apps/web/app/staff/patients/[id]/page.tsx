'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Phone, Calendar, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';

export default function PatientCardPage() {
  const { id } = useParams();

  const { data: patient } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data } = await api.get(`/patients/${id}`);
      return data.data;
    },
  });

  if (!patient) return <div className="page-container flex items-center justify-center"><p>Загрузка...</p></div>;

  return (
    <div className="pt-2">
      <h1 className="text-xl font-bold mb-4">{patient.user?.name}</h1>

      <Card className="mb-4 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Phone size={16} className="text-text-secondary" />
          <span>{patient.user?.phone}</span>
        </div>
        {patient.birthDate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={16} className="text-text-secondary" />
            <span>{new Date(patient.birthDate).toLocaleDateString('ru-RU')}</span>
          </div>
        )}
        {patient.allergyNotes && (
          <div className="flex items-center gap-2 text-sm text-error">
            <AlertTriangle size={16} />
            <span>{patient.allergyNotes}</span>
          </div>
        )}
      </Card>

      {patient.medHistory && patient.medHistory.length > 0 && (
        <section className="mb-4">
          <h2 className="font-semibold mb-2">История лечения</h2>
          <div className="space-y-2">
            {patient.medHistory.map((rec: Record<string, unknown>) => (
              <Card key={rec.id as string}>
                <p className="font-medium text-sm">{rec.diagnosis as string}</p>
                <p className="text-xs text-text-secondary">{rec.treatment as string}</p>
                <p className="text-[10px] text-text-secondary mt-1">
                  {new Date(rec.date as string).toLocaleDateString('ru-RU')} &middot; {((rec.staff as Record<string, unknown>)?.user as Record<string, unknown>)?.name as string}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-semibold mb-2">Записи</h2>
        <div className="space-y-2">
          {(patient.appointments || []).map((apt: Record<string, unknown>) => (
            <Card key={apt.id as string}>
              <div className="flex justify-between">
                <div>
                  <p className="font-medium text-sm">{(apt.service as Record<string, unknown>)?.name as string}</p>
                  <p className="text-xs text-text-secondary">
                    {new Date(apt.startTime as string).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="text-xs text-text-secondary">{apt.status as string}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
