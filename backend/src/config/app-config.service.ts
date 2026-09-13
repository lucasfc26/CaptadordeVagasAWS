import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  private get<T = string>(key: string): T {
    return this.configService.get<T>(key) as T;
  }

  get nodeEnv(): string {
    return this.get('NODE_ENV');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get port(): number {
    return this.get<number>('PORT');
  }

  get databaseUrl(): string {
    return this.get('DATABASE_URL');
  }

  get redisHost(): string {
    return this.get('REDIS_HOST');
  }

  get redisPort(): number {
    return this.get<number>('REDIS_PORT');
  }

  get redisPassword(): string | undefined {
    return this.get('REDIS_PASSWORD');
  }

  get redisDb(): number {
    return this.get<number>('REDIS_DB');
  }

  get jwtSecret(): string {
    return this.get('JWT_SECRET');
  }

  get jwtExpiresIn(): string {
    return this.get('JWT_EXPIRES_IN');
  }

  get corsOrigin(): string {
    return this.get('CORS_ORIGIN');
  }

  get jobSource(): 'amazon' | 'mock' {
    return this.get('JOB_SOURCE');
  }

  get monitoringConcurrency(): number {
    return this.get<number>('MONITORING_CONCURRENCY');
  }

  get warehouseExtractorUrl(): string | undefined {
    const url = this.get<string>('WAREHOUSE_EXTRACTOR_URL');
    return url?.trim() || undefined;
  }

  get smtp() {
    return {
      host: this.get<string>('SMTP_HOST'),
      port: this.get<number>('SMTP_PORT'),
      user: this.get<string>('SMTP_USER'),
      password: this.get<string>('SMTP_PASSWORD'),
      from: this.get<string>('SMTP_FROM'),
    };
  }

  get whatsappApiKey(): string | undefined {
    const key = this.get<string>('WHATSAPP_API_KEY');
    return key?.trim() || undefined;
  }

  get whatsappPhoneNumberId(): string | undefined {
    const id = this.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    return id?.trim() || undefined;
  }

  get whatsappGraphVersion(): string {
    const version = this.get<string>('WHATSAPP_GRAPH_VERSION');
    return version?.trim() || 'v25.0';
  }

  get whatsappTemplateName(): string {
    const name = this.get<string>('WHATSAPP_TEMPLATE_NAME');
    return name?.trim() || 'hello_world';
  }

  get whatsappTemplateLanguage(): string {
    const language = this.get<string>('WHATSAPP_TEMPLATE_LANGUAGE');
    return language?.trim() || 'en_US';
  }

  get whatsappTemplateBodyParams(): string[] {
    const raw = this.get<string>('WHATSAPP_TEMPLATE_BODY_PARAMS');
    return (raw ?? '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }
}
