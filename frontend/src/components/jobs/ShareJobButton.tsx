import type { MouseEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/context/ToastContext';
import { jobLocation } from '@/lib/display';
import { cn, shareOrCopy } from '@/lib/utils';
import type { Job } from '@/types';

export function ShareJobButton({ job, className }: { job: Job; className?: string }) {
  const { toast } = useToast();

  const handleShare = async (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const result = await shareOrCopy({
      title: job.title,
      text: `${job.title} — ${jobLocation(job)}`,
      url: job.externalUrl,
    });
    if (result === 'copied') toast('Link da vaga copiado');
    if (result === 'failed') toast('Não foi possível compartilhar a vaga');
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      title="Compartilhar vaga"
      aria-label="Compartilhar vaga"
      className={cn(
        'rounded-lg p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-secondary',
        className,
      )}
    >
      <Icon name="share" className="text-[20px]" />
    </button>
  );
}
