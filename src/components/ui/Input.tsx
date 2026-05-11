// src/components/ui/Input.tsx
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import clsx from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  /** Uses mono font when true (default) — designed for addresses, amounts, etc. */
  mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightSlot,
      mono = true,
      id,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const helperId = `${inputId}-helper`;
    const isError = Boolean(error);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary"
          >
            {label}
          </label>
        )}
        <div
          className={clsx(
            'relative flex items-center rounded-lg border bg-bg-tertiary transition-colors',
            'focus-within:border-accent-violet focus-within:ring-1 focus-within:ring-accent-violet',
            isError &&
              'border-accent-red focus-within:border-accent-red focus-within:ring-accent-red',
            disabled && 'opacity-60',
          )}
        >
          {leftIcon && (
            <span
              className="pointer-events-none flex h-10 w-10 shrink-0 items-center justify-center text-text-secondary"
              aria-hidden
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={isError || undefined}
            aria-describedby={helperText || error ? helperId : undefined}
            className={clsx(
              'w-full bg-transparent py-2 text-sm text-text-primary placeholder:text-text-secondary',
              'focus:outline-none disabled:cursor-not-allowed',
              mono ? 'font-mono' : 'font-sans',
              leftIcon ? 'pr-3' : 'px-3',
              rightSlot && 'pr-2',
              className,
            )}
            {...props}
          />
          {rightSlot && (
            <div className="flex shrink-0 items-center pr-2">{rightSlot}</div>
          )}
        </div>
        {(helperText || error) && (
          <p
            id={helperId}
            className={clsx(
              'text-xs',
              isError ? 'text-accent-red' : 'text-text-secondary',
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';