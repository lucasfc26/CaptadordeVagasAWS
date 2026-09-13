import { useNotifyJobWhatsapp } from '@/hooks';
import { useToast } from '@/context/ToastContext';
import { Icon } from '@/components/ui/Icon';
import { getErrorMessage } from '@/lib/utils';

export function WhatsAppNotifyButton({
  jobId,
  jobTitle,
  className = '',
}: {
  jobId: string;
  jobTitle: string;
  className?: string;
}) {
  const notify = useNotifyJobWhatsapp();
  const { toast } = useToast();

  return (
    <button
      type="button"
      disabled={notify.isPending}
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        notify.mutate(jobId, {
          onSuccess: () => toast(`WhatsApp enviado: ${jobTitle}`),
          onError: (error) => toast(getErrorMessage(error, 'Não foi possível enviar o WhatsApp')),
        });
      }}
      className={`inline-flex items-center justify-center gap-1 rounded-lg bg-tertiary/15 px-space-sm py-1.5 font-body-sm font-semibold text-tertiary hover:bg-tertiary/20 disabled:opacity-60 ${className}`}
    >
      <Icon name="chat" className="text-[16px]" />
      {notify.isPending ? 'Enviando...' : 'Enviar WhatsApp'}
    </button>
  );
}
