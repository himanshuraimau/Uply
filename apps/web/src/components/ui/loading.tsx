import { cn } from '@/lib/utils';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function Loading({ className, size = 'md', text }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={cn('flex items-center space-x-3', className)}>
      <div
        className={cn(
          'bg-primary border-2 border-border animate-pulse',
          sizeClasses[size],
        )}
      />
      {text && (
        <span className="text-lg font-bold text-card-foreground font-sans tracking-tight">
          {text}
        </span>
      )}
    </div>
  );
}
