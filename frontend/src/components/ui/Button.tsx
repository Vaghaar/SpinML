'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base
  'inline-flex items-center justify-center gap-2 rounded-xl font-body font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-500 text-white hover:bg-primary-600 active:scale-95 shadow-glow-primary hover:shadow-glow-primary',
        secondary:
          'bg-secondary-500 text-dark-bg hover:bg-secondary-600 active:scale-95 font-semibold',
        accent:
          'bg-accent-600 text-white hover:bg-accent-700 active:scale-95 shadow-glow-accent',
        ghost:
          'bg-transparent text-slate-300 hover:bg-dark-surface hover:text-white border border-dark-border',
        outline:
          'bg-transparent text-primary-400 border border-primary-500 hover:bg-primary-500/10 active:scale-95',
        danger:
          'bg-red-600 text-white hover:bg-red-700 active:scale-95',
      },
      size: {
        sm:   'h-8  px-4  text-sm',
        md:   'h-10 px-6  text-base',
        lg:   'h-12 px-8  text-lg',
        xl:   'h-16 px-10 text-xl',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size:    'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
);

Button.displayName = 'Button';
export { Button, buttonVariants };
