// ============================================
// JobWatch - Settings Page
// ============================================

import { useEffect, useState } from 'react';
import { User, Bell, Radar, Shield, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  useSettings,
  useUpdateSettings,
  useUpdateProfile,
  useChangePassword,
  useDeleteAccount,
} from '@/hooks';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { MONITORING_FREQUENCIES } from '@/lib/constants';
import { getErrorMessage } from '@/lib/utils';
import type { MonitoringFrequency } from '@/types';

export function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [deleteModal, setDeleteModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [notif, setNotif] = useState({
    email: true,
    push: true,
    sms: false,
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
    if (user) setName(user.name);
  }, [user]);

  const handleSaveProfile = () => {
    updateProfile.mutate(
      { name },
      {
        onSuccess: (updated) => {
          updateUser(updated);
          toast('Perfil atualizado');
        },
        onError: (error) => toast(getErrorMessage(error, 'Não foi possível atualizar o perfil')),
      },
    );
  };

  const handleSaveNotifications = () => {
    updateSettings.mutate(
      { notifications: notif },
      {
        onSuccess: () => toast('Notificações atualizadas'),
        onError: (error) => toast(getErrorMessage(error)),
      },
    );
  };

  const handleSaveMonitoring = () => {
    updateSettings.mutate(
      { monitoring },
      {
        onSuccess: () => toast('Configurações de monitoramento atualizadas'),
        onError: (error) => toast(getErrorMessage(error)),
      },
    );
  };

  const handleChangePassword = () => {
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
  };

  const handleDeleteAccount = () => {
    deleteAccount.mutate(undefined, {
      onSuccess: () => {
        logout();
        navigate('/login');
      },
      onError: (error) => toast(getErrorMessage(error, 'Não foi possível excluir a conta')),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-100">Configurações</h1>
        <p className="text-sm text-slate-400">Gerencie suas preferências e conta</p>
      </div>

      {/* Profile */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-medium text-slate-200">Perfil</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" type="email" value={user?.email || ''} disabled />
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSaveProfile} loading={updateProfile.isPending}>
            Salvar perfil
          </Button>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-medium text-slate-200">Notificações</h2>
        </div>
        <div className="space-y-3">
          <Switch checked={notif.email} onChange={(v) => setNotif({ ...notif, email: v })} label="Notificações por email" />
          <Switch checked={notif.push} onChange={(v) => setNotif({ ...notif, push: v })} label="Notificações push" />
          <Switch checked={notif.sms} onChange={(v) => setNotif({ ...notif, sms: v })} label="Notificações SMS" />
          <div className="border-t border-slate-800 pt-3 mt-3" />
          <Switch checked={notif.newJobAlert} onChange={(v) => setNotif({ ...notif, newJobAlert: v })} label="Alerta para novas vagas" />
          <Switch checked={notif.periodicSummary} onChange={(v) => setNotif({ ...notif, periodicSummary: v })} label="Resumo periódico" />
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSaveNotifications} loading={updateSettings.isPending}>Salvar</Button>
        </div>
      </Card>

      {/* Monitoring */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Radar className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-medium text-slate-200">Monitoramento</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Frequência padrão"
            value={monitoring.defaultFrequency}
            onChange={(e) =>
              setMonitoring({ ...monitoring, defaultFrequency: e.target.value as MonitoringFrequency })
            }
            options={MONITORING_FREQUENCIES.map((f) => ({ value: f.value, label: f.label }))}
          />
          <Select
            label="Timezone"
            value={monitoring.timezone}
            onChange={(e) => setMonitoring({ ...monitoring, timezone: e.target.value })}
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
          <Button size="sm" onClick={handleSaveMonitoring} loading={updateSettings.isPending}>Salvar</Button>
        </div>
      </Card>

      {/* Account */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-medium text-slate-200">Conta</h2>
        </div>
        <div className="space-y-3">
          {passwordError && (
            <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {passwordError}
            </div>
          )}
          <Input
            label="Senha atual"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="Nova senha"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)} icon={<Trash2 className="h-3.5 w-3.5" />}>
            Excluir conta
          </Button>
          <Button size="sm" onClick={handleChangePassword} loading={changePassword.isPending}>
            Alterar senha
          </Button>
        </div>
      </Card>

      {/* Delete Modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Excluir conta" description="Esta ação é irreversível. Todos os seus dados serão removidos.">
        <div className="flex items-center gap-3 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setDeleteModal(false)}>Cancelar</Button>
          <Button variant="danger" size="sm" onClick={handleDeleteAccount} loading={deleteAccount.isPending}>
            Excluir permanentemente
          </Button>
        </div>
      </Modal>
    </div>
  );
}
