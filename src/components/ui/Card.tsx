// src/components/ui/Card.tsx
import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';

type Padding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
  hoverable?: boolean;
}

const paddingStyles: Record<Padding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ padding = 'lg', hoverable = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'rounded-xl border bg-bg-secondary shadow-card',
        paddingStyles[padding],
        hoverable &&
          'transition-colors duration-150 hover:border-accent-violet/50',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx('mb-4 flex items-center justify-between gap-4', className)}
    {...props}
  >
    {children}
  </div>
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={clsx('text-base font-semibold text-text-primary', className)}
    {...props}
  >
    {children}
  </h3>
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={clsx('text-sm text-text-secondary', className)}
    {...props}
  >
    {children}
  </p>
));
CardDescription.displayName = 'CardDescription';