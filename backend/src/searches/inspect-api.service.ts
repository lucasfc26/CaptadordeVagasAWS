import { BadRequestException, Injectable } from '@nestjs/common';
import { assertPublicHttpUrl } from '../common/utils/public-http-url';
import { describeApiResponse, type ApiResponseShape } from './utils/api-response-shape';

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 10_000;

@Injectable()
export class InspectApiService {
  async inspect(url: string): Promise<ApiResponseShape> {
    let parsed: URL;
    try {
      parsed = await assertPublicHttpUrl(url);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'URL de API inválida');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(parsed.toString(), {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Accept: 'application/json, text/plain;q=0.8',
          'User-Agent': 'JobWatch/1.0',
        },
      });

      if (response.status >= 300 && response.status < 400) {
        throw new BadRequestException('A API redirecionou a requisição; use a URL final');
      }
      if (!response.ok) {
        throw new BadRequestException(`A API respondeu com status ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength > MAX_BYTES) {
        throw new BadRequestException('A resposta da API é grande demais para inspecionar');
      }

      let payload: unknown;
      try {
        payload = JSON.parse(buffer.toString('utf8'));
      } catch {
        throw new BadRequestException('A API não retornou JSON válido');
      }

      try {
        return describeApiResponse(payload);
      } catch (error) {
        throw new BadRequestException(
          error instanceof Error ? error.message : 'Não foi possível identificar os itens da API',
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new BadRequestException('A API demorou demais para responder');
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Não foi possível ler a resposta da API',
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
