import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-full bg-[color-mix(in_srgb,var(--secondary)_82%,white)]', className)} />;
}
