import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-lg bg-surface-container-high', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-space-md space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-14" />
        <Skeleton className="h-6 w-20" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-space-md space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-16" />
        </div>
      ))}
    </div>
  );
}
