import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { DeliveryStatus, NotificationChannel, NotificationStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../database/prisma.service';
import { NOTIFICATIONS_QUEUE } from '../queues/queue.constants';
import { EmailNotificationChannel } from './channels/email-notification.channel';
import { WhatsappNotificationChannel } from './channels/whatsapp-notification.channel';
import { UnavailableNotificationChannel } from './channels/unavailable-notification.channel';
import { NotificationChannelSender } from './channels/notification-channel.interface';

interface SendNotificationJobData {
  notificationId: string;
}

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private readonly senders: Map<NotificationChannel, NotificationChannelSender>;

  constructor(
    private readonly prisma: PrismaService,
    emailChannel: EmailNotificationChannel,
    whatsappChannel: WhatsappNotificationChannel,
  ) {
    super();
    this.senders = new Map([
      [NotificationChannel.EMAIL, emailChannel],
      [NotificationChannel.WHATSAPP, whatsappChannel],
      [NotificationChannel.PUSH, new UnavailableNotificationChannel(NotificationChannel.PUSH)],
      [NotificationChannel.SMS, new UnavailableNotificationChannel(NotificationChannel.SMS)],
    ]);
  }

  async process(job: Job<SendNotificationJobData>): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: job.data.notificationId },
      include: { deliveries: true, user: true, job: true },
    });

    if (!notification) {
      this.logger.warn(`Notificação ${job.data.notificationId} não encontrada`);
      return;
    }

    let anySent = false;

    for (const delivery of notification.deliveries) {
      if (delivery.status === DeliveryStatus.SENT) {
        anySent = true;
        continue;
      }

      const sender = this.senders.get(delivery.channel);

      try {
        if (!sender) {
          throw new Error(`Nenhum sender configurado para o canal ${delivery.channel}`);
        }

        const destination =
          delivery.channel === NotificationChannel.WHATSAPP ||
          delivery.channel === NotificationChannel.SMS
            ? notification.user.phone
            : notification.user.email;

        if (
          (delivery.channel === NotificationChannel.WHATSAPP ||
            delivery.channel === NotificationChannel.SMS) &&
          !destination
        ) {
          throw new Error(
            'Nenhum WhatsApp salvo em Configurações > Perfil para este usuário',
          );
        }

        this.logger.log(
          `Disparando ${delivery.channel} da notificação ${notification.id} para ${destination ?? 'destino vazio'}`,
        );

        await sender.send({
          to: destination,
          title: notification.title,
          message: notification.message,
          jobUrl: notification.job?.url,
        });

        await this.prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: DeliveryStatus.SENT,
            sentAt: new Date(),
            attempts: { increment: 1 },
          },
        });
        anySent = true;
      } catch (error) {
        this.logger.error(
          `Falha ao enviar ${delivery.channel} da notificação ${notification.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        await this.prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: DeliveryStatus.FAILED,
            errorMessage: error instanceof Error ? error.message : String(error),
            attempts: { increment: 1 },
          },
        });
      }
    }

    await this.prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: anySent ? NotificationStatus.SENT : NotificationStatus.FAILED,
        sentAt: anySent ? new Date() : undefined,
      },
    });
  }
}
