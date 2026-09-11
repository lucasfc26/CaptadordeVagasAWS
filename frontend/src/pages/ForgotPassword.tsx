// ============================================
// JobWatch - Forgot Password Page
// ============================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const schema = z.object({ email: z.string().email('Email inválido') });
type FormData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (_data: FormData) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          <Mail className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold text-slate-100">Email enviado</h2>
        <p className="text-sm text-slate-400">
          Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.
        </p>
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-100">Recuperar senha</h2>
        <p className="text-sm text-slate-400">Informe seu email para redefinir a senha</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Email" type="email" placeholder="seu@email.com" icon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register('email')} />
        <Button type="submit" loading={loading} className="w-full">Enviar</Button>
      </form>
      <p className="text-center text-sm text-slate-400">
        <Link to="/login" className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
