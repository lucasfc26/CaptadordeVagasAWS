// ============================================
// JobWatch - New Search Page
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, X } from 'lucide-react';
import { useCreateSearch } from '@/hooks';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Card } from '@/components/ui/Card';
import { MONITORING_FREQUENCIES, JOB_TYPES, NOTIFICATION_CHANNELS, RADII_OPTIONS } from '@/lib/constants';
import type { JobType, NotificationChannel } from '@/types';

interface FormData {
  name: string;
  location: string;
  radius: string;
  frequency: string;
}

export function SearchNewPage() {
  const navigate = useNavigate();
  const createSearch = useCreateSearch();
  const { toast } = useToast();
  const [keywords, setKeywords] = useState<string[]>(['Warehouse Associate']);
  const [additionalCities, setAdditionalCities] = useState<string[]>(['Richmond']);
  const [newKeyword, setNewKeyword] = useState('');
  const [newCity, setNewCity] = useState('');
  const [selectedJobTypes, setSelectedJobTypes] = useState<JobType[]>(['FULL_TIME', 'PART_TIME']);
  const [channels, setChannels] = useState<Record<string, boolean>>({ EMAIL: true, PUSH: true, SMS: false });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: 'Amazon Warehouse — Richmond',
      location: 'Richmond, CA',
      radius: '25',
      frequency: '1h',
    },
  });

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (kw: string) => setKeywords(keywords.filter((k) => k !== kw));

  const addCity = () => {
    if (newCity.trim() && !additionalCities.includes(newCity.trim())) {
      setAdditionalCities([...additionalCities, newCity.trim()]);
      setNewCity('');
    }
  };

  const removeCity = (city: string) => setAdditionalCities(additionalCities.filter((c) => c !== city));

  const toggleJobType = (type: JobType) => {
    setSelectedJobTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  };

  const onSubmit = (data: FormData) => {
    createSearch.mutate({
      name: data.name,
      location: data.location,
      radius: Number(data.radius),
      keywords,
      jobTypes: selectedJobTypes,
      additionalCities,
      frequency: data.frequency,
      notificationChannels: Object.entries(channels)
        .filter(([, v]) => v)
        .map(([k]) => k as NotificationChannel),
    }, {
      onSuccess: () => {
        toast('Monitoramento ativado com sucesso');
        navigate('/searches');
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-slate-100">Nova busca</h1>
          <p className="text-sm text-slate-400">Configure um novo monitoramento de vagas</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-medium text-slate-200">Informações básicas</h2>
          <Input label="Nome da busca" error={errors.name?.message} {...register('name', { required: 'Obrigatório' })} />
          <Input label="Localização" error={errors.location?.message} {...register('location', { required: 'Obrigatório' })} placeholder="Richmond, CA" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Raio de busca" options={RADII_OPTIONS.map((r) => ({ value: String(r), label: `${r} miles` }))} {...register('radius')} />
            <Select label="Frequência" options={MONITORING_FREQUENCIES.map((f) => ({ value: f.value, label: f.label }))} {...register('frequency')} />
          </div>
        </Card>

        {/* Keywords */}
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-medium text-slate-200">Palavras-chave</h2>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((kw) => (
              <span key={kw} className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">
                {kw}
                <button type="button" onClick={() => removeKeyword(kw)} className="text-slate-500 hover:text-slate-300"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())} placeholder="Adicionar palavra-chave" className="flex-1 rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50" />
            <Button type="button" variant="secondary" size="sm" onClick={addKeyword}>Adicionar</Button>
          </div>
        </Card>

        {/* Job Types */}
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-medium text-slate-200">Tipos de vaga</h2>
          <div className="flex flex-wrap gap-2">
            {JOB_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => toggleJobType(type.value)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${selectedJobTypes.includes(type.value) ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Additional Cities */}
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-medium text-slate-200">Cidades adicionais</h2>
          <div className="flex flex-wrap gap-1.5">
            {additionalCities.map((city) => (
              <span key={city} className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">
                {city}
                <button type="button" onClick={() => removeCity(city)} className="text-slate-500 hover:text-slate-300"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={newCity} onChange={(e) => setNewCity(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCity())} placeholder="Adicionar cidade" className="flex-1 rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50" />
            <Button type="button" variant="secondary" size="sm" onClick={addCity}>Adicionar</Button>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-medium text-slate-200">Canais de notificação</h2>
          <div className="space-y-3">
            {NOTIFICATION_CHANNELS.map((ch) => (
              <Switch key={ch.value} checked={channels[ch.value] || false} onChange={(v) => setChannels({ ...channels, [ch.value]: v })} label={ch.label} />
            ))}
          </div>
        </Card>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button type="submit" loading={createSearch.isPending}>Ativar monitoramento</Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
