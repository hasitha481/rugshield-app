// src/components/ui/Button.tsx
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-accent-violet text-white hover:bg-violet-600 active:bg-violet-700 ' +
    'focus-visible:ring-accent-violet',
  secondary:
    'bg-bg-tertiary text-text-primary border ' +
    'hover:border-accent-violet/50 hover:bg-[#252833] active:bg-bg-tertiary ' +
    'focus-visible:ring-accent-violet',
  danger:
    'bg-accent-red text-white hover:bg-red-600 active:bg-red-700 ' +
    'focus-visible:ring-accent-red',
  ghost:
    'bg-transparent text-text-primary hover:bg-bg-tertiary active:bg-[#252833] ' +
    'focus-visible:ring-accent-violet',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        className={clsx(
          'inline-flex items-center justify-center rounded-lg font-medium',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : leftIcon ? (
          <span className="inline-flex shrink-0" aria-hidden>
            {leftIcon}
          </span>
        ) : null}
        {children}
        {!isLoading && rightIcon ? (
          <span className="inline-flex shrink-0" aria-hidden>
            {rightIcon}
          </span>
        ) : null}
      </button>
    );
  },
);

Button.displayName = 'Button';