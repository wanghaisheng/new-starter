import { cn } from '@/utils/cn';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        'backdrop-blur-md bg-white/10 border border-white/20 rounded-xl',
        'shadow-lg shadow-black/10',
        className
      )}
    >
      {children}
    </div>
  );
} 