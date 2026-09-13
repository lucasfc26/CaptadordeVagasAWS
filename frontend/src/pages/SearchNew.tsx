import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCreateSearch, useInspectApi } from '@/hooks';
import { useToast } from '@/context/ToastContext';
import { NewSearchFrame } from '@/components/searches/NewSearchFrame';
import { JobApiInspector } from '@/components/searches/JobApiInspector';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import {
  MONITORING_FREQUENCIES,
  JOB_TYPES,
  NOTIFICATION_CHANNELS,
  RADII_OPTIONS,
  SEARCH_SOURCES,
  WAREHOUSE_EMPLOYMENT_TYPES,
  WAREHOUSE_HOURS,
  WAREHOUSE_LENGTHS,
  WAREHOUSE_SCHEDULES,
  WAREHOUSE_STARTS,
} from '@/lib/constants';
import { isCustomSearchSource, isWarehouseSearchSource } from '@/lib/searchMapping';
import { getErrorMessage } from '@/lib/utils';
import type { ApiInspectResult, JobType, NotificationChannel, SearchSourceType } from '@/types';

interface FormData {
  name: string;
  location: string;
  radius: string;
  frequency: string;
  targetUrl: string;
  xpath: string;
  zipCode: string;
  workHours: string;
  length: string;
  whenStart: string;
  jobTitle: string;
  employmentType: string;
  payRateMin: string;
  payRateMax: string;
}

const SOURCE_DEFAULTS: Record<SearchSourceType, { name: string; keywords: string[] }> = {
  AMAZON_JOBS: { name: 'Amazon Jobs — Richmond', keywords: ['Software Engineer', 'Operations'] },
  AMAZON_WAREHOUSE: { name: 'Amazon Warehouse', keywords: [] },
  JOB_API: { name: 'Monitoramento por API', keywords: [] },
  JOB_XPATH: { name: 'Monitoramento por XPath', keywords: [] },
};

function isSearchSource(value: string | null): value is SearchSourceType {
  return SEARCH_SOURCES.some((item) => item.value === value);
}

export function SearchNewPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sourceParam = searchParams.get('source');
  const source = isSearchSource(sourceParam) ? sourceParam : null;

  if (!source) {
    return (
      <NewSearchFrame
        open
        onClose={() => navigate('/searches')}
        onSelect={(next) => setSearchParams({ source: next }, { replace: true })}
      />
    );
  }

  return <SearchNewForm key={source} source={source} />;
}

function SearchNewForm({ source }: { source: SearchSourceType }) {
  const navigate = useNavigate();
  const createSearch = useCreateSearch();
  const inspectApi = useInspectApi();
  const { toast } = useToast();
  const defaults = SOURCE_DEFAULTS[source];
  const custom = isCustomSearchSource(source);
  const isJobApi = source === 'JOB_API';
  const isWarehouse = isWarehouseSearchSource(source);

  const [keywords, setKeywords] = useState<string[]>(defaults.keywords);
  const [additionalCities, setAdditionalCities] = useState<string[]>(['Richmond']);
  const [newKeyword, setNewKeyword] = useState('');
  const [newCity, setNewCity] = useState('');
  const [warehouseSchedule, setWarehouseSchedule] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<JobType[]>(['FULL_TIME', 'PART_TIME']);
  const [channels, setChannels] = useState<Record<string, boolean>>({
    EMAIL: true,
    WHATSAPP: true,
    PUSH: false,
    SMS: false,
  });

  const [apiShape, setApiShape] = useState<ApiInspectResult | null>(null);
  const [apiFilterValues, setApiFilterValues] = useState<Record<string, string[]>>({});

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: defaults.name,
      location: 'Richmond, CA',
      radius: '25',
      frequency: '1h',
      targetUrl: '',
      xpath: '',
      zipCode: '',
      workHours: '',
      length: '',
      whenStart: '',
      jobTitle: '',
      employmentType: 'Both',
      payRateMin: '0',
      payRateMax: '100',
    },
  });
  const targetUrl = watch('targetUrl');

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const addCity = () => {
    if (newCity.trim() && !additionalCities.includes(newCity.trim())) {
      setAdditionalCities([...additionalCities, newCity.trim()]);
      setNewCity('');
    }
  };

  const toggleApiFilter = (path: string, value: string) => {
    setApiFilterValues((current) => {
      const selected = current[path] ?? [];
      const next = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];
      return { ...current, [path]: next };
    });
  };

  const onSubmit = (data: FormData) => {
    if (isJobApi && !apiShape) {
      toast('Carregue a resposta da API para montar os filtros');
      return;
    }

    createSearch.mutate({
      name: data.name,
      sourceType: source,
      targetUrl: data.targetUrl,
      xpath: data.xpath,
      warehouseFilters: isWarehouse
        ? {
            zipCode: data.zipCode.trim(),
            jobTitle: data.jobTitle.trim() || undefined,
            workHours: data.workHours ? Number(data.workHours) : undefined,
            schedule: warehouseSchedule,
            length: data.length || undefined,
            whenStart: data.whenStart || undefined,
            employmentType: data.employmentType || 'Both',
            payRateMin: data.payRateMin !== '' ? Number(data.payRateMin) : 0,
            payRateMax: data.payRateMax !== '' ? Number(data.payRateMax) : 100,
          }
        : undefined,
      apiFilters: isJobApi
        ? {
            itemPath: apiShape?.itemPath,
            filters: Object.entries(apiFilterValues)
              .filter(([, values]) => values.length > 0)
              .map(([path, values]) => ({ path, values })),
          }
        : undefined,
      location: data.location,
      radius: Number(data.radius),
      keywords,
      jobTypes: selectedJobTypes,
      additionalCities,
      frequency: data.frequency,
      notificationChannels: Object.entries(channels)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key as NotificationChannel),
    }, {
      onSuccess: () => {
        toast('Monitoramento ativado com sucesso');
        navigate('/searches');
      },
      onError: (error) => toast(getErrorMessage(error, 'Não foi possível criar o monitoramento')),
    });
  };

  const sourceMeta = SEARCH_SOURCES.find((item) => item.value === source)!;

  return (
    <div className="space-y-space-lg">
      <div className="flex items-center gap-space-sm">
        <button type="button" onClick={() => navigate(-1)} className="text-on-surface-variant hover:text-on-surface">
          <Icon name="arrow_back" className="text-[20px]" />
        </button>
        <div>
          <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">Nova Busca</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">{sourceMeta.description}</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary-container/20 px-space-sm py-1 font-mono-sm text-mono-sm font-semibold text-primary">
          <Icon name={sourceMeta.icon} className="text-[14px]" />
          {sourceMeta.label}
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-space-md">
        <Card className="space-y-space-md p-space-lg">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Informações básicas</h2>
          <Input label="Nome da busca" error={errors.name?.message} {...register('name', { required: 'Obrigatório' })} />
          {isWarehouse ? (
            <>
              <Input
                label="Zip Code or Address"
                placeholder="94547"
                hint="Mesmo campo do assistente do hiring.amazon.com"
                error={errors.zipCode?.message}
                {...register('zipCode', { required: 'Informe o CEP ou o endereço' })}
              />
              <Input
                label="Job Search"
                placeholder="Warehouse Associate"
                hint="Filtra pelo nome da vaga na lista do hiring.amazon.com"
                {...register('jobTitle')}
              />
              <Select
                label="Work Hours"
                options={WAREHOUSE_HOURS.map((item) => ({ value: item.value, label: item.label }))}
                {...register('workHours')}
              />
              <div className="space-y-2">
                <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">Schedule</p>
                <div className="flex flex-wrap gap-2">
                  {WAREHOUSE_SCHEDULES.map((item) => {
                    const active = warehouseSchedule.includes(item.value);
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() =>
                          setWarehouseSchedule((current) =>
                            current.includes(item.value)
                              ? current.filter((value) => value !== item.value)
                              : [...current, item.value],
                          )
                        }
                        className={`rounded-full px-3 py-1.5 font-body-sm text-body-sm font-medium transition-colors ${
                          active
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="When Start"
                  options={WAREHOUSE_STARTS.map((item) => ({ value: item.value, label: item.label }))}
                  {...register('whenStart')}
                />
                <Select
                  label="Length (Duration)"
                  options={WAREHOUSE_LENGTHS.map((item) => ({ value: item.value, label: item.label }))}
                  {...register('length')}
                />
                <Select
                  label="Type"
                  options={WAREHOUSE_EMPLOYMENT_TYPES.map((item) => ({ value: item.value, label: item.label }))}
                  {...register('employmentType')}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Payment mín. (US$ 0–100)"
                  type="number"
                  min={0}
                  max={100}
                  hint={'“A consultar” entra em qualquer faixa. “Up to $22” entra de 0–22 até $100.'}
                  {...register('payRateMin')}
                />
                <Input
                  label="Payment máx. (US$ 0–100)"
                  type="number"
                  min={0}
                  max={100}
                  {...register('payRateMax')}
                />
              </div>
              <Select label="Frequência" options={MONITORING_FREQUENCIES.map((item) => ({ value: item.value, label: item.label }))} {...register('frequency')} />
            </>
          ) : custom ? (
            <>
              <Input
                label={isJobApi ? 'URL da API' : 'URL da vaga'}
                placeholder={isJobApi ? 'https://api.exemplo.com/vagas' : 'https://...'}
                error={errors.targetUrl?.message}
                hint={isJobApi ? 'Endpoint JSON que lista as vagas' : undefined}
                {...register('targetUrl', { required: isJobApi ? 'Informe a URL da API' : 'Informe a URL da página' })}
              />
              {isJobApi && (
                <JobApiInspector
                  url={targetUrl}
                  inspecting={inspectApi.isPending}
                  shape={apiShape}
                  selected={apiFilterValues}
                  onToggleValue={toggleApiFilter}
                  onInspect={async () => {
                    const result = await inspectApi.mutateAsync(targetUrl);
                    setApiShape(result);
                    setApiFilterValues({});
                    return result;
                  }}
                />
              )}
              {source === 'JOB_XPATH' && (
                <Input
                  label="XPath"
                  placeholder="//div[@class='job-card']"
                  error={errors.xpath?.message}
                  hint="Seletor usado para identificar as vagas na página"
                  {...register('xpath', { required: 'Informe o XPath' })}
                />
              )}
            </>
          ) : (
            <>
              <Input label="Localização" error={errors.location?.message} {...register('location', { required: 'Obrigatório' })} placeholder="Richmond, CA" />
              <div className="grid grid-cols-2 gap-4">
                <Select label="Raio de busca" options={RADII_OPTIONS.map((radius) => ({ value: String(radius), label: `${radius} miles` }))} {...register('radius')} />
                <Select label="Frequência" options={MONITORING_FREQUENCIES.map((item) => ({ value: item.value, label: item.label }))} {...register('frequency')} />
              </div>
            </>
          )}
          {custom && (
            <Select label="Frequência" options={MONITORING_FREQUENCIES.map((item) => ({ value: item.value, label: item.label }))} {...register('frequency')} />
          )}
        </Card>

        {!custom && !isWarehouse && (
          <>
            <Card className="space-y-space-md p-space-lg">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Palavras-chave</h2>
              <ChipEditor
                items={keywords}
                onRemove={(item) => setKeywords(keywords.filter((keyword) => keyword !== item))}
                value={newKeyword}
                onChange={setNewKeyword}
                onAdd={addKeyword}
                placeholder="Adicionar palavra-chave"
              />
            </Card>

            <Card className="space-y-space-md p-space-lg">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Tipos de vaga</h2>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setSelectedJobTypes((prev) =>
                        prev.includes(type.value) ? prev.filter((item) => item !== type.value) : [...prev, type.value],
                      )
                    }
                    className={`rounded-full px-3 py-1.5 font-body-sm text-body-sm font-medium transition-colors ${
                      selectedJobTypes.includes(type.value)
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="space-y-space-md p-space-lg">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Cidades adicionais</h2>
              <ChipEditor
                items={additionalCities}
                onRemove={(item) => setAdditionalCities(additionalCities.filter((city) => city !== item))}
                value={newCity}
                onChange={setNewCity}
                onAdd={addCity}
                placeholder="Adicionar cidade"
              />
            </Card>
          </>
        )}

        <Card className="space-y-space-md p-space-lg">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Canais de notificação</h2>
          <div className="space-y-3">
            {NOTIFICATION_CHANNELS.map((channel) => (
              <Switch
                key={channel.value}
                checked={channels[channel.value] || false}
                onChange={(enabled) => setChannels({ ...channels, [channel.value]: enabled })}
                label={channel.label}
              />
            ))}
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={createSearch.isPending}>Ativar monitoramento</Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}

function ChipEditor({
  items,
  onRemove,
  value,
  onChange,
  onAdd,
  placeholder,
}: {
  items: string[];
  onRemove: (item: string) => void;
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  placeholder: string;
}) {
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-1 font-body-sm text-body-sm text-on-surface">
            {item}
            <button type="button" onClick={() => onRemove(item)} className="text-outline hover:text-error">
              <Icon name="close" className="text-[14px]" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), onAdd())}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-outline/70 transition-colors focus:border-secondary/60 focus:outline-none focus:ring-2 focus:ring-secondary/25"
        />
        <Button type="button" variant="secondary" size="sm" onClick={onAdd}>Adicionar</Button>
      </div>
    </>
  );
}
