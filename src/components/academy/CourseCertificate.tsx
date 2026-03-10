import { Award, Download } from 'lucide-react';

interface Props {
  courseName: string;
  employeeName: string;
  completedAt: string;
}

export function CourseCertificate({ courseName, employeeName, completedAt }: Props) {
  const date = new Date(completedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleDownload = () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560">
        <rect fill="#f8f9fa" width="800" height="560" rx="16"/>
        <rect fill="none" stroke="#6366f1" stroke-width="3" x="20" y="20" width="760" height="520" rx="12"/>
        <rect fill="none" stroke="#6366f1" stroke-width="1" stroke-dasharray="6,3" x="30" y="30" width="740" height="500" rx="8"/>
        <text x="400" y="100" text-anchor="middle" font-family="Georgia,serif" font-size="32" fill="#1e1b4b" font-weight="bold">СЕРТИФИКАТ</text>
        <text x="400" y="135" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" fill="#6b7280">о прохождении курса</text>
        <line x1="150" y1="160" x2="650" y2="160" stroke="#6366f1" stroke-width="1" opacity="0.3"/>
        <text x="400" y="220" text-anchor="middle" font-family="Georgia,serif" font-size="28" fill="#1e1b4b">${employeeName}</text>
        <text x="400" y="270" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" fill="#6b7280">успешно завершил(а) курс</text>
        <text x="400" y="320" text-anchor="middle" font-family="Georgia,serif" font-size="22" fill="#6366f1" font-weight="bold">${courseName}</text>
        <text x="400" y="380" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" fill="#6b7280">Дата завершения: ${date}</text>
        <text x="400" y="470" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#9ca3af">Академия • Система обучения по контрольным листам</text>
      </svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${courseName.replace(/\s+/g, '-')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border border-primary/20 bg-primary/5 rounded-xl p-6 text-center space-y-4">
      <Award size={48} className="text-primary mx-auto" />
      <div>
        <h3 className="text-lg font-display font-bold text-foreground">Курс завершён!</h3>
        <p className="text-sm text-muted-foreground font-body mt-1">Поздравляем с успешным прохождением</p>
      </div>
      <div className="bg-card border border-border rounded-lg p-4 inline-block">
        <p className="text-xs text-muted-foreground font-body">Курс</p>
        <p className="text-sm font-display font-bold text-foreground">{courseName}</p>
        <p className="text-xs text-muted-foreground font-body mt-2">Дата</p>
        <p className="text-sm font-display font-semibold text-foreground">{date}</p>
      </div>
      <button
        onClick={handleDownload}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-display font-bold text-sm flex items-center gap-2 mx-auto hover:bg-primary/90 transition-all"
      >
        <Download size={16} /> Скачать сертификат
      </button>
    </div>
  );
}
