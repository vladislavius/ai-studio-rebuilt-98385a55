import { FileText, Upload, FileDown } from 'lucide-react';
import { DocumentsSubView } from '@/types';

interface Props {
  subView: DocumentsSubView;
}

export function DocumentsList({ subView }: Props) {
  const labels: Record<DocumentsSubView, { title: string; desc: string; icon: typeof FileText }> = {
    sent: { title: 'Отправленные документы', desc: 'Документы, отправленные сотрудникам и партнёрам', icon: FileText },
    received: { title: 'Полученные документы', desc: 'Входящие документы от сотрудников', icon: Upload },
    closing: { title: 'Закрывающие документы', desc: 'Акты, счета и закрывающие документы', icon: FileDown },
  };

  const info = labels[subView];

  return (
    <div className="text-center py-12">
      <info.icon size={40} className="text-muted-foreground/30 mx-auto mb-3" />
      <h3 className="font-display font-semibold text-foreground mb-1">{info.title}</h3>
      <p className="text-muted-foreground font-body text-sm mb-4">{info.desc}</p>
      <p className="text-xs text-muted-foreground/60">Документы загружаются в карточке сотрудника (раздел «Файлы»)</p>
    </div>
  );
}
