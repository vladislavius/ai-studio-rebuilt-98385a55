import { useState } from 'react';
import { Video, VideoOff, X, ExternalLink } from 'lucide-react';

interface Props {
  courseId: string;
  employeeId: string;
  courseName?: string;
}

export function JitsiVideoCall({ courseId, employeeId, courseName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Generate a unique room name based on course + employee
  const roomName = `lovable-training-${courseId.slice(0, 8)}-${employeeId.slice(0, 8)}`;
  const displayName = courseName ? `Обучение: ${courseName}` : 'Видеозвонок с куратором';
  const jitsiUrl = `https://meet.jit.si/${roomName}#config.prejoinConfig.enabled=false&config.startWithAudioMuted=true&config.startWithVideoMuted=false&userInfo.displayName=${encodeURIComponent(displayName)}`;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 md:bottom-8 right-20 z-50 w-12 h-12 bg-accent-foreground text-background rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-all"
        title="Видеозвонок с куратором"
      >
        <Video size={20} />
      </button>
    );
  }

  return (
    <div className={`fixed z-50 ${isFullscreen ? 'inset-0' : 'bottom-24 md:bottom-8 right-4 w-[400px] h-[320px]'} bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300`}>
      <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Video size={14} className="text-emerald-500" />
          <span className="text-xs font-display font-bold text-foreground">Видеозвонок</span>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={jitsiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded hover:bg-accent text-muted-foreground"
            title="Открыть в новом окне"
          >
            <ExternalLink size={12} />
          </a>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded hover:bg-accent text-muted-foreground"
            title={isFullscreen ? 'Свернуть' : 'На весь экран'}
          >
            <VideoOff size={12} />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-accent text-muted-foreground">
            <X size={12} />
          </button>
        </div>
      </div>

      <iframe
        src={jitsiUrl}
        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
        className="flex-1 w-full"
        style={{ border: 'none' }}
      />
    </div>
  );
}
