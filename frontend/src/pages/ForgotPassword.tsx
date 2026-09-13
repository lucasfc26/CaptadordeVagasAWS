import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

const schema = z.object({ email: z.string().email('Email inválido') });
type FormData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-container/20 text-primary">
          <Icon name="mail" className="text-[24px]" />
        </div>
        <h2 className="font-headline-md text-headline-md text-on-surface">Email enviado</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.
        </p>
        <Link to="/login" className="inline-flex items-center gap-1 font-body-sm text-body-sm text-primary">
          <Icon name="arrow_back" className="text-[16px]" />
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-space-lg">
      <div>
        <h2 className="font-headline-md text-headline-md text-on-surface">Recuperar senha</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Informe seu email para redefinir a senha</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Email" type="text" placeholder="seu@email.com" mask="email" autoComplete="email" icon={<Icon name="mail" className="text-[16px]" />} error={errors.email?.message} {...register('email')} />
        <Button type="submit" loading={loading} className="w-full">Enviar</Button>
      </form>
      <p className="text-center">
        <Link to="/login" className="inline-flex items-center gap-1 font-body-sm text-body-sm text-primary">
          <Icon name="arrow_back" className="text-[16px]" />
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
