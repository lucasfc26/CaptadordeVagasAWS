import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDeleteJob, useJob, useMarkJobViewed } from '@/hooks';
import { useToast } from '@/context/ToastContext';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import { facilityCode, formatPay, jobMapQuery, jobTypeLabel } from '@/lib/display';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import { JobMap } from '@/components/jobs/JobMap';
import { ShareJobButton } from '@/components/jobs/ShareJobButton';
import { WhatsAppNotifyButton } from '@/components/jobs/WhatsAppNotifyButton';

export function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading } = useJob(id || '');
  const markViewed = useMarkJobViewed();
  const deleteJob = useDeleteJob();
  const { toast } = useToast();

  useEffect(() => {
    if (job?.status === 'NEW') markViewed.mutate(job.id);
  }, [job?.id, job?.status, markViewed]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-4 py-12 text-center">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Vaga não encontrada</h2>
        <Link to="/jobs">
          <Button variant="outline" size="sm">Voltar para vagas</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-space-lg">
      <Link to="/jobs" className="inline-flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface">
        <Icon name="arrow_back" className="text-[16px]" />
        Voltar para vagas
      </Link>

      <section className="relative overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-low p-space-lg shadow-elevation-2">
        <div className="flex flex-wrap items-center justify-between gap-space-xs">
          <div className="flex flex-wrap items-center gap-space-xs">
            {job.status === 'NEW' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-container/20 px-2.5 py-0.5 font-mono-sm text-mono-sm font-bold uppercase tracking-wider text-primary">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-primary" />
                Novo Match
              </span>
            )}
            <span className="rounded bg-surface-container px-2 py-0.5 font-mono-data text-mono-data font-semibold text-secondary">
              {facilityCode(job.facility)}
            </span>
            <StatusBadge status={job.status} />
          </div>
          <ShareJobButton job={job} />
        </div>
        <h1 className="mt-space-sm font-headline-lg text-headline-lg tracking-tight text-on-surface">{job.title}</h1>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
          {job.facility} — {job.location.address || `${job.location.city}, ${job.location.state}`}
        </p>
        <div className="mt-space-md grid grid-cols-2 gap-space-sm rounded-xl bg-surface-container p-space-sm sm:grid-cols-4">
          <DetailChip label="Compensação" value={formatPay(job.salary)} />
          <DetailChip label="Duração" value={job.schedule || '—'} />
          <DetailChip label="Modalidade" value={jobTypeLabel(job.jobType)} />
          <DetailChip
            label={job.status === 'EXPIRED' ? 'Última vez apresentada' : 'Sinalizada'}
            value={formatRelativeTime(job.lastSeenAt || job.foundAt)}
          />
        </div>
        <div className="mt-space-md flex flex-wrap gap-space-sm">
          <WhatsAppNotifyButton jobId={job.id} jobTitle={job.title} />
          <a
            href={job.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-space-xs rounded-full bg-primary px-space-md py-2.5 font-body-sm font-semibold text-on-primary shadow-accent-primary transition-all hover:brightness-110 active:scale-[0.97]"
          >
            Candidate-se agora
            <Icon name="open_in_new" className="text-[16px]" />
          </a>
          <Button
            variant="danger"
            onClick={() => {
              if (!window.confirm(`Excluir a vaga "${job.title}"?`)) return;
              deleteJob.mutate(job.id, {
                onSuccess: () => {
                  toast(`"${job.title}" excluída`);
                  navigate('/jobs');
                },
              });
            }}
            loading={deleteJob.isPending}
          >
            Excluir vaga
          </Button>
        </div>
      </section>

      {job.description && (
        <Card className="space-y-space-sm p-space-lg">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Descrição</h2>
          <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">{job.description}</p>
        </Card>
      )}

      {job.requirements && job.requirements.length > 0 && (
        <Card className="space-y-space-sm p-space-lg">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Requisitos</h2>
          <ul className="space-y-1.5">
            {job.requirements.map((req) => (
              <li key={req} className="flex items-start gap-2 font-body-md text-body-md text-on-surface-variant">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {req}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {job.benefits && job.benefits.length > 0 && (
        <Card className="space-y-space-sm p-space-lg">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Benefícios</h2>
          <ul className="space-y-1.5">
            {job.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 font-body-md text-body-md text-on-surface-variant">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                {benefit}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="space-y-space-sm p-space-lg">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Detalhes</h2>
        <dl className="space-y-2">
          <Row label="Data de descoberta" value={formatDateTime(job.foundAt)} />
          <Row label="Última vez apresentada" value={formatDateTime(job.lastSeenAt || job.foundAt)} />
          {job.status === 'EXPIRED' && (
            <Row label="Status" value="Não apresentada na última varredura" />
          )}
          <Row label="Local" value={job.location.address || `${job.location.city}, ${job.location.state}`} />
          <Row label="Centro" value={job.facility} />
          <Row label="ID" value={`#${job.id.slice(0, 8)}`} />
        </dl>
        <JobMap
          query={jobMapQuery(job)}
          label={job.location.address || `${job.location.city}, ${job.location.state}`}
        />
      </Card>
    </div>
  );
}

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block font-label-caps text-label-caps uppercase text-outline">{label}</span>
      <span className="font-body-sm text-body-sm font-semibold text-on-surface">{value}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="font-body-sm text-body-sm text-on-surface-variant">{label}</dt>
      <dd className="font-body-sm text-body-sm text-on-surface">{value}</dd>
    </div>
  );
}
