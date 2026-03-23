import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(({ className, ...props }, ref) => (
  <input
    className={cn(
      'surface-border flex h-10 w-full rounded-full bg-[var(--input)] px-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
