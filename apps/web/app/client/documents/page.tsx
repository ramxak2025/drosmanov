'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Image, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';

const TYPE_ICONS: Record<string, typeof FileText> = {
  XRAY: Image,
  PHOTO: Image,
  CONTRACT: FileText,
  OTHER: FileText,
};

const TYPE_LABELS: Record<string, string> = {
  XRAY: 'Рентген',
  PHOTO: 'Фото',
  CONTRACT: 'Договор',
  OTHER: 'Документ',
};

export default function DocumentsPage() {
  const { data: documents } = useQuery({
    queryKey: ['my-documents'],
    queryFn: async () => {
      // Client gets their documents through patient endpoint
      const userStr = localStorage.getItem('user');
      if (!userStr) return [];
      // For now, return empty — documents are fetched via patient profile
      return [];
    },
  });

  return (
    <div className="pt-2">
      <h1 className="text-xl font-bold mb-4">Мои документы</h1>

      {(!documents || documents.length === 0) ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-text-secondary" />
          </div>
          <p className="text-text-secondary">Документы появятся после первого визита</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc: Record<string, unknown>, i: number) => {
            const Icon = TYPE_ICONS[(doc.type as string)] || FileText;
            return (
              <motion.div
                key={doc.id as string}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{doc.originalName as string}</p>
                    <p className="text-xs text-text-secondary">
                      {TYPE_LABELS[doc.type as string]} &middot; {new Date(doc.uploadedAt as string).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <a href={`/api/documents/${doc.id}/download`} className="p-2 text-primary">
                    <Download size={20} />
                  </a>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
