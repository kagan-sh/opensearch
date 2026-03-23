import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-medium transition-all outline-none disabled:pointer-events-none disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
  {
    variants: {
      variant: {
        default: 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_18px_44px_rgba(66,196,214,0.2)] hover:translate-y-[-1px] hover:brightness-110',
        secondary: 'bg-[rgba(255,255,255,0.04)] text-[var(--secondary-foreground)] hover:bg-[rgba(255,255,255,0.08)]',
        ghost: 'bg-transparent text-[var(--foreground)] hover:bg-[var(--secondary)]',
        outline: 'surface-border bg-[rgba(255,255,255,0.02)] text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.06)]',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-9 px-3.5 text-[13px]',
        lg: 'h-11 px-5 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
  ),
);
Button.displayName = 'Button';

export { Button, buttonVariants };
