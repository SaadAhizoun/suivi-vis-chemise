import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
  delay?: number;
}

export function KPICard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  variant = 'default',
  className,
  delay = 0
}: KPICardProps) {
  const variantStyles = {
    default: {
      card: 'bg-card',
      icon: 'bg-muted text-muted-foreground',
      value: 'text-foreground',
    },
    primary: {
      card: 'bg-gradient-to-br from-primary to-secondary text-primary-foreground',
      icon: 'bg-primary-foreground/20 text-primary-foreground',
      value: 'text-primary-foreground',
    },
    success: {
      card: 'bg-card border-l-4 border-l-status-ok',
      icon: 'bg-status-ok/10 text-status-ok',
      value: 'text-status-ok',
    },
    warning: {
      card: 'bg-card border-l-4 border-l-status-warning',
      icon: 'bg-status-warning/10 text-status-warning',
      value: 'text-status-warning',
    },
    danger: {
      card: 'bg-card border-l-4 border-l-status-danger',
      icon: 'bg-status-danger/10 text-status-danger',
      value: 'text-status-danger',
    },
  };
  
  const styles = variantStyles[variant];
  
  return (
    <div 
      className={cn(
        'card-industrial p-5 opacity-0 animate-fade-in',
        styles.card,
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn(
            "text-sm font-medium mb-1",
            variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <p className={cn(
            "text-3xl font-bold tracking-tight",
            styles.value
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              "text-xs mt-1",
              variant === 'primary' ? 'text-primary-foreground/60' : 'text-muted-foreground'
            )}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-xl",
          styles.icon
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
