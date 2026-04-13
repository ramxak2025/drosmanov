'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { User } from 'lucide-react';
import api from '@/lib/api';

export default function OwnerStaffPage() {
  const { data: staff } = useQuery({
    queryKey: ['owner-staff'],
    queryFn: async () => { const { data } = await api.get('/staff'); return data.data; },
  });

  return (
    <div className="pt-2">
      <h1 className="text-xl font-bold mb-4">Персонал</h1>
      <div className="space-y-3">
        {(staff || []).map((s: Record<string, unknown>) => (
          <Card key={s.id as string}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={24} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{(s.user as Record<string, unknown>)?.name as string}</p>
                <p className="text-sm text-text-secondary">{s.specialty as string}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${s.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                {s.isActive ? 'Активен' : 'Неактивен'}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
