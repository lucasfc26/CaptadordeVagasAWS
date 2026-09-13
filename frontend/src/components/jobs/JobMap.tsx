import { Icon } from '@/components/ui/Icon';
import { googleMapsEmbedUrl, googleMapsSearchUrl } from '@/lib/display';

export function JobMap({
  query,
  label,
}: {
  query: string;
  label?: string;
}) {
  if (!query.trim()) return null;

  return (
    <div className="mt-space-md">
      <div className="mb-space-xs flex items-center justify-between gap-space-xs">
        <h4 className="font-label-caps text-label-caps uppercase tracking-wider text-outline">Localização</h4>
        <a
          href={googleMapsSearchUrl(query)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono-sm text-mono-sm text-secondary hover:underline"
        >
          Abrir no Maps
        </a>
      </div>
      <div className="relative h-36 overflow-hidden rounded-xl bg-surface-container-highest shadow-inner">
        <iframe
          title={label || 'Mapa da vaga'}
          src={googleMapsEmbedUrl(query)}
          className="absolute inset-0 h-full w-full border-0 grayscale-[0.15]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-surface-container-lowest via-surface-container-lowest/70 to-transparent p-space-sm">
          <div className="flex items-center gap-1.5 font-body-sm text-body-sm font-semibold text-on-surface">
            <Icon name="pin_drop" className="text-[16px] text-primary" />
            <span className="line-clamp-2">{label || query}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
