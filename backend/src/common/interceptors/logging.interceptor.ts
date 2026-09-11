import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(request, response.statusCode, start),
        error: (error: unknown) => {
          const statusCode =
            error && typeof error === 'object' && 'status' in error ? Number(error.status) : 500;
          this.log(request, statusCode, start);
        },
      }),
    );
  }

  private log(request: Request, statusCode: number, start: number) {
    const duration = Date.now() - start;
    this.logger.log(`${request.method} ${request.originalUrl} ${statusCode} +${duration}ms`);
  }
}
