import { cn } from '@/lib/utils';
import { Status, getStatusLabel } from '@/types/maintenance';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true,
  className 
}: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };
  
  const statusConfig = {
    ok: {
      bgClass: 'bg-status-ok text-status-ok-foreground',
      icon: CheckCircle2,
    },
    a_commander: {
      bgClass: 'bg-status-warning text-status-warning-foreground',
      icon: AlertTriangle,
    },
    a_changer: {
      bgClass: 'bg-status-danger text-status-danger-foreground',
      icon: XCircle,
    },
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full whitespace-nowrap',
        sizeClasses[size],
        config.bgClass,
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {getStatusLabel(status)}
    </span>
  );
}

interface StatusDotProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export function StatusDot({ status, size = 'md', pulse = false }: StatusDotProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };
  
  const statusColors = {
    ok: 'bg-status-ok',
    a_commander: 'bg-status-warning',
    a_changer: 'bg-status-danger',
  };
  
  return (
    <span
      className={cn(
        'inline-block rounded-full',
        sizeClasses[size],
        statusColors[status],
        pulse && 'animate-pulse-soft'
      )}
    />
  );
}
