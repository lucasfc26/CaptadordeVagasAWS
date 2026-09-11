// ============================================
// JobWatch - Job Details Page
// ============================================

import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Eye, MapPin, Clock, Building2, DollarSign, Calendar, Briefcase } from 'lucide-react';
import { useJob, useMarkJobViewed } from '@/hooks';
import { useToast } from '@/context/ToastContext';
import { StatusBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatRelativeTime, formatDateTime } from '@/lib/utils';

export function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading } = useJob(id || '');
  const markViewed = useMarkJobViewed();
  const { toast } = useToast();

  const handleMarkViewed = () => {
    if (!job) return;
    markViewed.mutate(job.id, {
      onSuccess: () => toast(`"${job.title}" marcada como visualizada`),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-4 text-center py-12">
        <h2 className="text-sm font-medium text-slate-300">Vaga não encontrada</h2>
        <Link to="/jobs">
          <Button variant="outline" size="sm">Voltar para vagas</Button>
        </Link>
      </div>
    );
  }

  const jobTypeLabels: Record<string, string> = {
    FULL_TIME: 'Tempo integral',
    PART_TIME: 'Meio período',
    SEASONAL: 'Sazonal',
    TEMPORARY: 'Temporário',
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link to="/jobs" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para vagas
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-lg font-semibold text-slate-100">{job.title}</h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location.city}, {job.location.state}</span>
              <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {job.facility}</span>
            </div>
          </div>
          <StatusBadge status={job.status} />
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {jobTypeLabels[job.jobType] || job.jobType}</span>
          {job.salary && <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> {job.salary}</span>}
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Encontrada {formatRelativeTime(job.foundAt)}</span>
          {job.schedule && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {job.schedule}</span>}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <a href={job.externalUrl} target="_blank" rel="noopener noreferrer">
            <Button icon={<ExternalLink className="h-3.5 w-3.5" />}>
              Candidate-se agora
            </Button>
          </a>
          {job.status === 'NEW' && (
            <Button variant="outline" onClick={handleMarkViewed} loading={markViewed.isPending} icon={<Eye className="h-3.5 w-3.5" />}>
              Marcar como visualizada
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      {job.description && (
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-medium text-slate-200">Descrição</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{job.description}</p>
        </Card>
      )}

      {/* Requirements */}
      {job.requirements && job.requirements.length > 0 && (
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-medium text-slate-200">Requisitos</h2>
          <ul className="space-y-1.5">
            {job.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Benefits */}
      {job.benefits && job.benefits.length > 0 && (
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-medium text-slate-200">Benefícios</h2>
          <ul className="space-y-1.5">
            {job.benefits.map((benefit, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Details */}
      <Card className="p-5 space-y-3">
        <h2 className="text-sm font-medium text-slate-200">Detalhes</h2>
        <dl className="space-y-2 text-sm">
          <DetailRow label="Data de descoberta" value={formatDateTime(job.foundAt)} />
          <DetailRow label="Status" value={<StatusBadge status={job.status} />} />
          <DetailRow label="Tipo" value={jobTypeLabels[job.jobType] || job.jobType} />
          <DetailRow label="Local" value={`${job.location.city}, ${job.location.state}`} />
          <DetailRow label="Centro" value={job.facility} />
          {job.salary && <DetailRow label="Salário" value={job.salary} />}
          {job.schedule && <DetailRow label="Horário" value={job.schedule} />}
        </dl>
      </Card>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-slate-500 shrink-0">{label}</dt>
      <dd className="text-slate-300 text-right">{value}</dd>
    </div>
  );
}
