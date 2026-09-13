import { cn } from '@/lib/utils';

interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
}

export function Icon({ name, className, filled }: IconProps) {
  return (
    <span
      className={cn('material-symbols-outlined', className)}
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
    >
      {name}
    </span>
  );
}
