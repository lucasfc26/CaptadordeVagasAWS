import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { createTransport, Transporter } from 'nodemailer';
import { AppConfigService } from '../../config/app-config.service';
import { NotificationChannelSender, NotificationPayload } from './notification-channel.interface';

@Injectable()
export class EmailNotificationChannel implements NotificationChannelSender {
  readonly channel = NotificationChannel.EMAIL;
  private readonly logger = new Logger(EmailNotificationChannel.name);
  private readonly transporter?: Transporter;
  private readonly from: string;

  constructor(private readonly config: AppConfigService) {
    const smtp = config.smtp;
    this.from = smtp.from || 'JobWatch <no-reply@jobwatch.local>';

    if (smtp.host) {
      this.transporter = createTransport({
        host: smtp.host,
        port: smtp.port || 587,
        secure: smtp.port === 465,
        auth: smtp.user ? { user: smtp.user, pass: smtp.password } : undefined,
      });
    }
  }

  async send(payload: NotificationPayload): Promise<void> {
    if (!this.transporter) {
      this.logger.log(
        `[SMTP não configurado] Email para ${payload.to}: ${payload.title} — ${payload.message}`,
      );
      return;
    }

    await this.transporter.sendMail({
      from: this.from,
      to: payload.to,
      subject: payload.title,
      text: `${payload.message}${payload.jobUrl ? `\n\n${payload.jobUrl}` : ''}`,
      html: `<p>${payload.message}</p>${
        payload.jobUrl ? `<p><a href="${payload.jobUrl}">Candidate-se agora</a></p>` : ''
      }`,
    });
  }
}
