import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface CyberneticCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: string;
}

export const CyberneticCard = React.forwardRef<HTMLDivElement, CyberneticCardProps>(
  ({ className, glowColor, style, children, ...props }, forwardedRef) => {
    const localRef = useRef<HTMLDivElement>(null);
    const ref = (forwardedRef as React.RefObject<HTMLDivElement>) || localRef;

    useEffect(() => {
      const el = (ref as React.RefObject<HTMLDivElement>).current;
      if (!el) return;

      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      };

      el.addEventListener('mousemove', onMove);
      return () => el.removeEventListener('mousemove', onMove);
    }, [ref]);

    return (
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className={cn(
          'cybernetic-card relative rounded-xl border border-border bg-card overflow-hidden transition-all cursor-pointer group',
          className
        )}
        style={{
          '--glow-color': glowColor ?? 'hsl(var(--primary))',
          ...style,
        } as React.CSSProperties}
        {...props}
      >
        {/* Glow overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(250px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--glow-color) 0%, transparent 100%)',
            opacity: 'var(--glow-opacity, 0)',
            mixBlendMode: 'soft-light',
          }}
        />
        {/* Border glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--glow-color) 0%, transparent 100%)',
            mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1px',
            borderRadius: 'inherit',
            opacity: 'var(--border-glow-opacity, 0)',
          }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);
CyberneticCard.displayName = 'CyberneticCard';
