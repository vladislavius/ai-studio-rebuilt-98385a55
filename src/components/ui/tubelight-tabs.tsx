import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLabels } from '@/hooks/useLabels';

interface TubelightTabsProps {
  items: { id: string; label?: string; labelKey?: string; icon: React.ElementType }[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
  variant?: 'default' | 'pill' | 'compact';
}

export function TubelightTabs({ items, activeId, onSelect, className, variant = 'default' }: TubelightTabsProps) {
  const { t } = useLabels();

  return (
    <div className={cn('flex bg-accent p-1.5 rounded-lg gap-1.5 flex-wrap', className)}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeId === item.id;
        const text = item.label ?? (item.labelKey ? t(item.labelKey) : item.id);

        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              'relative cursor-pointer text-sm font-display font-semibold rounded-lg transition-colors flex items-center gap-2',
              variant === 'compact' ? 'px-3 py-2' : 'px-4 py-2.5',
              variant === 'pill' ? 'flex-1 justify-center' : '',
              isActive
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon size={16} />
            <span className={variant === 'compact' ? 'hidden sm:inline' : ''}>{text}</span>

            {isActive && (
              <motion.div
                layoutId={`tubelight-${variant}`}
                className="absolute inset-0 rounded-lg pointer-events-none"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              >
                <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-[2px] bg-primary rounded-full" />
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-4 bg-primary/20 blur-md rounded-full" />
              </motion.div>
            )}
          </button>
        );
      })}
    </div>
  );
}
