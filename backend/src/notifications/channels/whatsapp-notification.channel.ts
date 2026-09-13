import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { AppConfigService } from '../../config/app-config.service';
import { toWhatsappRecipient } from '../../common/utils/phone';
import { NotificationChannelSender, NotificationPayload } from './notification-channel.interface';
import {
  buildWhatsappTemplateComponents,
  buildWhatsappTextBody,
  isWhatsappSessionWindowError,
} from './whatsapp-payload';

interface DebugTokenResponse {
  data?: {
    granular_scopes?: Array<{ scope: string; target_ids?: string[] }>;
  };
}

interface PhoneNumbersResponse {
  data?: Array<{ id: string }>;
}

@Injectable()
export class WhatsappNotificationChannel implements NotificationChannelSender {
  readonly channel = NotificationChannel.WHATSAPP;
  private readonly logger = new Logger(WhatsappNotificationChannel.name);
  private readonly apiKey?: string;
  private readonly graphApiBase: string;
  private readonly templateName: string;
  private readonly templateLanguage: string;
  private readonly templateParamKeys: string[];
  private phoneNumberId?: string;

  constructor(config: AppConfigService) {
    this.apiKey = config.whatsappApiKey;
    this.phoneNumberId = config.whatsappPhoneNumberId;
    this.graphApiBase = `https://graph.facebook.com/${config.whatsappGraphVersion}`;
    this.templateName = config.whatsappTemplateName;
    this.templateLanguage = config.whatsappTemplateLanguage;
    this.templateParamKeys = config.whatsappTemplateBodyParams;
  }

  async send(payload: NotificationPayload): Promise<void> {
    if (!this.apiKey) {
      throw new Error(
        'WHATSAPP_API_KEY não está configurada. Defina a chave no .env da raiz do projeto e recrie api e worker.',
      );
    }

    if (!payload.to) {
      throw new Error(
        'Nenhum WhatsApp salvo em Configurações > Perfil. Salve o número e tente de novo.',
      );
    }

    const to = toWhatsappRecipient(payload.to);
    if (!to) {
      throw new Error(`O WhatsApp salvo em Configurações é inválido: ${payload.to}`);
    }

    const phoneNumberId = await this.resolvePhoneNumberId();
    this.logger.log(`Enviando WhatsApp para ${to} pelo número ${phoneNumberId}`);

    const textError = await this.postMessage(phoneNumberId, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: true, body: buildWhatsappTextBody(payload) },
    });

    if (!textError) {
      return;
    }

    if (!this.templateName || !isWhatsappSessionWindowError(textError)) {
      throw new Error(`Falha ao enviar WhatsApp para ${to}: ${textError}`);
    }

    this.logger.warn(
      `Texto rejeitado fora da janela de 24h. Enviando template ${this.templateName} para ${to}`,
    );

    const components = buildWhatsappTemplateComponents(payload, this.templateParamKeys);
    const templateError = await this.postMessage(phoneNumberId, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: this.templateName,
        language: { code: this.templateLanguage },
        ...(components.length ? { components } : {}),
      },
    });

    if (templateError) {
      throw new Error(`Falha ao enviar WhatsApp para ${to}: ${templateError}`);
    }
  }

  private async postMessage(phoneNumberId: string, body: unknown): Promise<string | null> {
    const response = await fetch(`${this.graphApiBase}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return null;
    }

    return `${response.status} ${await response.text()}`;
  }

  private async resolvePhoneNumberId(): Promise<string> {
    if (this.phoneNumberId) {
      return this.phoneNumberId;
    }

    const debugResponse = await fetch(
      `${this.graphApiBase}/debug_token?input_token=${encodeURIComponent(this.apiKey!)}&access_token=${encodeURIComponent(this.apiKey!)}`,
    );
    if (!debugResponse.ok) {
      const detail = await debugResponse.text();
      throw new Error(
        `Não foi possível descobrir o WHATSAPP_PHONE_NUMBER_ID (${debugResponse.status}). Defina WHATSAPP_PHONE_NUMBER_ID no .env. ${detail.slice(0, 200)}`,
      );
    }

    const debug = (await debugResponse.json()) as DebugTokenResponse;
    const targetIds =
      debug.data?.granular_scopes
        ?.filter((scope) => scope.scope.includes('whatsapp'))
        .flatMap((scope) => scope.target_ids ?? []) ?? [];

    for (const id of targetIds) {
      const phonesResponse = await fetch(`${this.graphApiBase}/${id}/phone_numbers`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (phonesResponse.ok) {
        const phones = (await phonesResponse.json()) as PhoneNumbersResponse;
        const phoneNumberId = phones.data?.[0]?.id;
        if (phoneNumberId) {
          this.phoneNumberId = phoneNumberId;
          return phoneNumberId;
        }
      }

      this.phoneNumberId = id;
      return id;
    }

    throw new Error(
      'WHATSAPP_API_KEY válida, mas nenhum número de envio foi encontrado. Defina WHATSAPP_PHONE_NUMBER_ID no .env.',
    );
  }
}
