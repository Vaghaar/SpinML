import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  neon?:  boolean;
}

export function Card({ className, glass = true, neon = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-6',
        glass && 'glass',
        neon  && 'neon-border',
        !glass && 'bg-dark-surface border border-dark-border',
        'shadow-card-dark',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('font-title text-xl font-bold text-white', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-slate-300', className)} {...props} />;
}
