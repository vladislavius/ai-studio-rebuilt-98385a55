import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';

interface Props {
  courseId: string;
  employeeId: string;
  stepId?: string | null;
  mode: 'chat' | 'step_comment';
}

export function TrainingChat({ courseId, employeeId, stepId, mode }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(mode === 'step_comment');
  const scrollRef = useRef<HTMLDivElement>(null);

  const queryKey = mode === 'step_comment'
    ? ['training-messages', courseId, employeeId, stepId]
    : ['training-messages', courseId, employeeId, 'chat'];

  const { data: messages = [] } = useQuery({
    queryKey,
    queryFn: async () => {
      let q = supabase
        .from('training_messages')
        .select('*')
        .eq('course_id', courseId)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: true });

      if (mode === 'step_comment' && stepId) {
        q = q.eq('step_id', stepId).eq('message_type', 'step_comment');
      } else {
        q = q.eq('message_type', 'chat').is('step_id', null);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`training-${courseId}-${employeeId}-${mode}-${stepId || 'all'}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'training_messages',
        filter: `course_id=eq.${courseId}`,
      }, () => {
        qc.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [courseId, employeeId, mode, stepId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isOpen]);

  const sendMut = useMutation({
    mutationFn: async (text: string) => {
      if (!user) return;
      const { error } = await supabase.from('training_messages').insert({
        course_id: courseId,
        employee_id: employeeId,
        step_id: mode === 'step_comment' ? stepId : null,
        sender_id: user.id,
        sender_name: user.email || 'Пользователь',
        message: text,
        message_type: mode === 'step_comment' ? 'step_comment' : 'chat',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage('');
      qc.invalidateQueries({ queryKey });
    },
  });

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMut.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Step comments — inline
  if (mode === 'step_comment') {
    return (
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-display font-bold text-muted-foreground">
            <MessageCircle size={14} />
            Комментарии к шагу ({messages.length})
          </div>
          <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="border-t border-border">
            <div ref={scrollRef} className="max-h-48 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">Комментариев пока нет</p>
              )}
              {messages.map(msg => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 ${isMe ? 'bg-primary/10 text-foreground' : 'bg-muted text-foreground'}`}>
                      <p className="text-[10px] font-display font-bold text-muted-foreground mb-0.5">{msg.sender_name}</p>
                      <p className="text-xs font-body">{msg.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-2 border-t border-border flex gap-2">
              <Input
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Написать комментарий..."
                className="text-xs h-8"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || sendMut.isPending}
                className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Send size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Floating chat panel
  return (
    <>
      {/* Toggle button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-50 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all"
        >
          <MessageCircle size={20} />
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {messages.length}
            </span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 max-h-[60vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <MessageCircle size={14} className="text-primary" />
              <span className="text-xs font-display font-bold text-foreground">Чат с куратором</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-accent text-muted-foreground">
              <X size={14} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px] max-h-[40vh]">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">Напишите сообщение куратору</p>
            )}
            {messages.map(msg => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                    <p className={`text-[10px] font-bold mb-0.5 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{msg.sender_name}</p>
                    <p className="text-xs">{msg.message}</p>
                    <p className={`text-[9px] mt-1 ${isMe ? 'text-primary-foreground/50' : 'text-muted-foreground'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-2 border-t border-border flex gap-2">
            <Input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Сообщение..."
              className="text-xs h-8"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || sendMut.isPending}
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
