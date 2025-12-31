import type { ReactNode } from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'primary';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: string;
  iconPosition?: 'left' | 'right';
  pulse?: boolean;
  dot?: boolean;
  className?: string;
  onClick?: () => void;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  gray: 'badge-gray',
  primary: 'bg-[var(--color-primary-50)] text-[var(--color-primary)] border border-[var(--color-primary)]/20'
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-3 py-1 text-xs',
  lg: 'px-4 py-1.5 text-sm'
};

export default function Badge({
  children,
  variant = 'gray',
  size = 'md',
  icon,
  iconPosition = 'left',
  pulse = false,
  dot = false,
  className = '',
  onClick
}: BadgeProps) {
  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold
        font-['Outfit',sans-serif] tracking-wide
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${pulse ? 'pulse' : ''}
        ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
        ${className}
      `}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {/* Pulse dot indicator */}
      {dot && (
        <span className="relative flex h-2 w-2">
          <span className={`
            animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
            ${variant === 'success' ? 'bg-[var(--color-success)]' : ''}
            ${variant === 'warning' ? 'bg-[var(--color-warning)]' : ''}
            ${variant === 'danger' ? 'bg-[var(--color-error)]' : ''}
            ${variant === 'info' ? 'bg-[var(--color-info)]' : ''}
            ${variant === 'primary' ? 'bg-[var(--color-primary)]' : ''}
            ${variant === 'gray' ? 'bg-[var(--color-text-muted)]' : ''}
          `} />
          <span className={`
            relative inline-flex rounded-full h-2 w-2
            ${variant === 'success' ? 'bg-[var(--color-success)]' : ''}
            ${variant === 'warning' ? 'bg-[var(--color-warning)]' : ''}
            ${variant === 'danger' ? 'bg-[var(--color-error)]' : ''}
            ${variant === 'info' ? 'bg-[var(--color-info)]' : ''}
            ${variant === 'primary' ? 'bg-[var(--color-primary)]' : ''}
            ${variant === 'gray' ? 'bg-[var(--color-text-muted)]' : ''}
          `} />
        </span>
      )}

      {/* Left icon */}
      {icon && iconPosition === 'left' && !dot && (
        <i className={`${icon} text-[0.7em]`}></i>
      )}

      {children}

      {/* Right icon */}
      {icon && iconPosition === 'right' && (
        <i className={`${icon} text-[0.7em]`}></i>
      )}
    </Component>
  );
}

// Status badge variant (convenience component)
export interface StatusBadgeProps {
  status: string;
  size?: BadgeSize;
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<string, { variant: BadgeVariant; icon: string; label: string }> = {
  pending: { variant: 'warning', icon: 'fas fa-clock', label: '待确认' },
  scheduled: { variant: 'info', icon: 'fas fa-calendar-check', label: '已预约' },
  confirmed: { variant: 'success', icon: 'fas fa-check-circle', label: '已确认' },
  arrived: { variant: 'info', icon: 'fas fa-user-check', label: '已到达' },
  completed: { variant: 'success', icon: 'fas fa-check-double', label: '已完成' },
  'no-show': { variant: 'danger', icon: 'fas fa-user-times', label: '未到场' },
  cancelled: { variant: 'gray', icon: 'fas fa-times-circle', label: '已取消' },
  declined: { variant: 'danger', icon: 'fas fa-ban', label: '已拒绝' }
};

export function StatusBadge({ status, size = 'md', showIcon = true, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] || { variant: 'gray' as BadgeVariant, icon: 'fas fa-question', label: status };

  return (
    <Badge
      variant={config.variant}
      size={size}
      icon={showIcon ? config.icon : undefined}
      className={className}
    >
      {config.label}
    </Badge>
  );
}

// Count badge (for notifications, etc.)
export interface CountBadgeProps {
  count: number;
  max?: number;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export function CountBadge({ count, max = 99, variant = 'danger', size = 'sm', className = '' }: CountBadgeProps) {
  const displayCount = count > max ? `${max}+` : count;

  if (count === 0) return null;

  return (
    <Badge
      variant={variant}
      size={size}
      className={`min-w-[1.5em] justify-center ${className}`}
    >
      {displayCount}
    </Badge>
  );
}
