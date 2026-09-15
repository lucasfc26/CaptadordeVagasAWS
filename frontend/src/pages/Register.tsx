import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { getErrorMessage } from '@/lib/utils';
import { isValidPhone } from '@/lib/phone';

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().refine(isValidPhone, 'Informe um WhatsApp válido com DDI (+55, +1, …)'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string().min(8, 'Mínimo 8 caracteres'),
}).refine((data) => data.password === data.confirmPassword, { message: 'Senhas não conferem', path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao criar conta'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-space-lg">
      <div>
        <h2 className="font-headline-md text-headline-md text-on-surface">Criar conta</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Comece a monitorar vagas agora</p>
      </div>

      {error && (
        <div className="rounded-xl border border-error/20 bg-error-container/20 px-3 py-2 font-body-sm text-body-sm text-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Nome" type="text" placeholder="Seu nome" icon={<Icon name="person" className="text-[16px]" />} error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="text" placeholder="seu@email.com" mask="email" autoComplete="email" icon={<Icon name="mail" className="text-[16px]" />} error={errors.email?.message} {...register('email')} />
        <Input label="WhatsApp" type="tel" placeholder="+55 (11) 99999-9999" mask="phone" autoComplete="tel" icon={<Icon name="call" className="text-[16px]" />} error={errors.phone?.message} hint="Com DDI. Brasil: +55; EUA: digite +1. Usado nas notificações" {...register('phone')} />
        <Input label="Senha" type="password" placeholder="••••••••" icon={<Icon name="lock" className="text-[16px]" />} error={errors.password?.message} {...register('password')} />
        <Input label="Confirmar senha" type="password" placeholder="••••••••" icon={<Icon name="lock" className="text-[16px]" />} error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" loading={loading} className="w-full">Criar conta</Button>
      </form>

      <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
        Já tem conta?{' '}
        <Link to="/login" className="font-semibold text-primary hover:text-primary-fixed-dim">Entrar</Link>
      </p>
    </div>
  );
}
