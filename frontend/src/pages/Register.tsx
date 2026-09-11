// ============================================
// JobWatch - Register Page
// ============================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Mínimo 6 caracteres'),
}).refine((d) => d.password === d.confirmPassword, { message: 'Senhas não conferem', path: ['confirmPassword'] });

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
      await registerUser({ name: data.name, email: data.email, password: data.password, confirmPassword: data.confirmPassword });
      navigate('/dashboard');
    } catch {
      setError('Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-100">Criar conta</h2>
        <p className="text-sm text-slate-400">Comece a monitorar vagas agora</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Nome" type="text" placeholder="Seu nome" icon={<User className="h-4 w-4" />} error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" placeholder="seu@email.com" icon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register('email')} />
        <Input label="Senha" type="password" placeholder="••••••••" icon={<Lock className="h-4 w-4" />} error={errors.password?.message} {...register('password')} />
        <Input label="Confirmar senha" type="password" placeholder="••••••••" icon={<Lock className="h-4 w-4" />} error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" loading={loading} className="w-full">Criar conta</Button>
      </form>

      <p className="text-center text-sm text-slate-400">
        Já tem conta?{' '}
        <Link to="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">Entrar</Link>
      </p>
    </div>
  );
}
