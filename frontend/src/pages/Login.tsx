import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await login({ email: data.email, password: data.password });
      navigate('/dashboard');
    } catch {
      setError('Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-space-lg">
      <div>
        <h2 className="font-headline-md text-headline-md text-on-surface">Entrar</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Acesse sua conta para monitorar vagas</p>
      </div>

      {error && (
        <div className="rounded-xl border border-error/20 bg-error-container/20 px-3 py-2 font-body-sm text-body-sm text-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="text"
          placeholder="seu@email.com"
          mask="email"
          autoComplete="email"
          icon={<Icon name="mail" className="text-[16px]" />}
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="relative">
          <Input
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            icon={<Icon name="lock" className="text-[16px]" />}
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-8 text-outline hover:text-on-surface"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-[18px]" />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
            <input type="checkbox" className="rounded border-outline-variant" />
            Lembrar sessão
          </label>
          <Link to="/forgot-password" className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary">
            Esqueci minha senha
          </Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">Entrar</Button>
      </form>

      <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
        Não tem conta?{' '}
        <Link to="/register" className="font-semibold text-primary hover:text-primary-fixed-dim">Criar conta</Link>
      </p>
    </div>
  );
}
