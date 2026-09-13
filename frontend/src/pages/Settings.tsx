import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import {
  useChangePassword,
  useDeleteAccount,
  useSettings,
  useUpdateProfile,
  useUpdateSettings,
} from '@/hooks';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Icon } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import { MONITORING_FREQUENCIES } from '@/lib/constants';
import { formatPhoneMask } from '@/lib/masks';
import { getErrorMessage } from '@/lib/utils';
import type { MonitoringFrequency } from '@/types';

export function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [deleteModal, setDeleteModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [notif, setNotif] = useState({
    email: true,
    push: false,
    sms: false,
    whatsapp: true,
    newJobAlert: true,
    periodicSummary: true,
  });
  const [monitoring, setMonitoring] = useState<{ defaultFrequency: MonitoringFrequency; timezone: string }>({
    defaultFrequency: '1h',
    timezone: 'America/Los_Angeles',
  });

  useEffect(() => {
    if (settings) {
      setNotif(settings.notifications);
      setMonitoring(settings.monitoring);
    }
  }, [settings]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ? formatPhoneMask(user.phone) : '');
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-space-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">Configurações do Sistema</h1>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
          Perfil, canais de disparo, parâmetros de varredura e segurança da sessão.
        </p>
      </div>

      <section id="aparencia" className="flex flex-col space-y-space-md rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-space-lg shadow-elevation-1">
        <SectionTitle icon="contrast" title="Aparência" />
        <div className="grid grid-cols-2 gap-space-sm">
          <ThemeOption active={theme === 'dark'} onClick={() => setTheme('dark')} label="Modo escuro" icon="dark_mode" />
          <ThemeOption active={theme === 'light'} onClick={() => setTheme('light')} label="Modo claro" icon="light_mode" />
        </div>
      </section>

      <section id="perfil" className="flex flex-col space-y-space-md rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-space-lg shadow-elevation-1">
        <SectionTitle icon="person" title="Perfil do Usuário" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Nome" value={name} onChange={(event) => setName(event.target.value)} />
          <Input label="Email" type="text" mask="email" value={user?.email || ''} disabled />
          <Input
            label="WhatsApp"
            type="tel"
            mask="phone"
            placeholder="(11) 99999-9999 ou +1 510..."
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            hint="Mesmo número do WhatsApp, com DDI. EUA: +1; Brasil: DDD + 9"
          />
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() =>
              updateProfile.mutate(
                { name, phone },
                {
                  onSuccess: (updated) => {
                    updateUser(updated);
                    toast('Perfil atualizado');
                  },
                  onError: (error) => toast(getErrorMessage(error, 'Não foi possível atualizar o perfil')),
                },
              )
            }
            loading={updateProfile.isPending}
          >
            Salvar perfil
          </Button>
        </div>
      </section>

      <section id="notificacoes" className="flex flex-col space-y-space-md rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-space-lg shadow-elevation-1">
        <SectionTitle icon="notifications" title="Canais de Notificação & Regras de Disparo" />
        <div className="space-y-3">
          <Switch checked={notif.email} onChange={(value) => setNotif({ ...notif, email: value })} label="Notificações por email" />
          <Switch checked={notif.whatsapp} onChange={(value) => setNotif({ ...notif, whatsapp: value })} label="Notificações por WhatsApp" />
          <Switch checked={notif.push} onChange={(value) => setNotif({ ...notif, push: value })} label="Notificações push" />
          <Switch checked={notif.sms} onChange={(value) => setNotif({ ...notif, sms: value })} label="Notificações SMS" />
          <div className="mt-3 border-t border-outline-variant/20 pt-3" />
          <Switch checked={notif.newJobAlert} onChange={(value) => setNotif({ ...notif, newJobAlert: value })} label="Alerta para novas vagas" />
          <Switch checked={notif.periodicSummary} onChange={(value) => setNotif({ ...notif, periodicSummary: value })} label="Resumo periódico" />
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() =>
              updateSettings.mutate(
                { notifications: notif },
                {
                  onSuccess: () => toast('Notificações atualizadas'),
                  onError: (error) => toast(getErrorMessage(error)),
                },
              )
            }
            loading={updateSettings.isPending}
          >
            Salvar
          </Button>
        </div>
      </section>

      <section id="parametros" className="flex flex-col space-y-space-md rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-space-lg shadow-elevation-1">
        <SectionTitle icon="radar" title="Parâmetros de Varredura & Scraping" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Frequência padrão"
            value={monitoring.defaultFrequency}
            onChange={(event) => setMonitoring({ ...monitoring, defaultFrequency: event.target.value as MonitoringFrequency })}
            options={MONITORING_FREQUENCIES.map((item) => ({ value: item.value, label: item.label }))}
          />
          <Select
            label="Timezone"
            value={monitoring.timezone}
            onChange={(event) => setMonitoring({ ...monitoring, timezone: event.target.value })}
            options={[
              { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
              { value: 'America/Denver', label: 'Mountain Time (MT)' },
              { value: 'America/Chicago', label: 'Central Time (CT)' },
              { value: 'America/New_York', label: 'Eastern Time (ET)' },
              { value: 'America/Sao_Paulo', label: 'Brasília Time (BRT)' },
            ]}
          />
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() =>
              updateSettings.mutate(
                { monitoring },
                {
                  onSuccess: () => toast('Configurações de monitoramento atualizadas'),
                  onError: (error) => toast(getErrorMessage(error)),
                },
              )
            }
            loading={updateSettings.isPending}
          >
            Salvar
          </Button>
        </div>
      </section>

      <section id="seguranca" className="flex flex-col space-y-space-md rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-space-lg shadow-elevation-1">
        <SectionTitle icon="shield" title="Segurança & Sessão" />
        {passwordError && (
          <div className="rounded-xl border border-error/20 bg-error-container/20 px-3 py-2 font-body-sm text-body-sm text-error">
            {passwordError}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Senha atual" type="password" placeholder="••••••••" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
          <Input label="Nova senha" type="password" placeholder="••••••••" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)}>Excluir conta</Button>
          <Button
            size="sm"
            onClick={() => {
              setPasswordError('');
              if (!currentPassword || !newPassword) {
                setPasswordError('Preencha a senha atual e a nova senha');
                return;
              }
              changePassword.mutate(
                { currentPassword, newPassword },
                {
                  onSuccess: () => {
                    setCurrentPassword('');
                    setNewPassword('');
                    toast('Senha atualizada com sucesso');
                  },
                  onError: (error) => setPasswordError(getErrorMessage(error, 'Não foi possível alterar a senha')),
                },
              );
            }}
            loading={changePassword.isPending}
          >
            Alterar senha
          </Button>
        </div>
      </section>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Excluir conta" description="Esta ação é irreversível. Todos os seus dados serão removidos.">
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={() => setDeleteModal(false)}>Cancelar</Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() =>
              deleteAccount.mutate(undefined, {
                onSuccess: () => {
                  logout();
                  navigate('/login');
                },
                onError: (error) => toast(getErrorMessage(error, 'Não foi possível excluir a conta')),
              })
            }
            loading={deleteAccount.isPending}
          >
            Excluir permanentemente
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-space-sm">
      <Icon name={icon} className="text-[20px] text-primary" />
      <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">{title}</h2>
    </div>
  );
}

function ThemeOption({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-space-sm rounded-xl px-space-md py-space-sm transition-colors ${
        active ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
      }`}
    >
      <Icon name={icon} className="text-[18px]" />
      <span className="font-body-sm text-body-sm font-semibold">{label}</span>
    </button>
  );
}
