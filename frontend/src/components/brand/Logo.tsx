export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <rect
        width="30.5"
        height="30.5"
        x="0.75"
        y="0.75"
        rx="9"
        fill="var(--jw-surface-container-lowest)"
        stroke="var(--jw-outline-variant)"
        strokeWidth="1"
      />
      {/* mira/radar — vaga localizada com precisão e sob monitoramento contínuo */}
      <circle cx="16" cy="16" r="6.5" stroke="var(--jw-primary)" strokeWidth="2" />
      <circle cx="16" cy="16" r="1.6" fill="var(--jw-primary)" />
      <path
        d="M16 6.25V9.75M16 22.25V25.75M6.25 16H9.75M22.25 16H25.75"
        stroke="var(--jw-primary)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
