import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

function normalizeErrors(response: unknown) {
  if (!response || typeof response !== 'object') {
    return undefined;
  }

  const message = (response as { message?: unknown }).message;
  if (!Array.isArray(message)) {
    return undefined;
  }

  return message.map((entry) => ({
    message: String(entry),
  }));
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : undefined;

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : exceptionResponse &&
            typeof exceptionResponse === 'object' &&
            typeof (exceptionResponse as { message?: unknown }).message ===
              'string'
          ? (exceptionResponse as { message: string }).message
          : statusCode === HttpStatus.INTERNAL_SERVER_ERROR
            ? 'Internal server error'
            : 'Request failed';

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors: normalizeErrors(exceptionResponse),
      path: request.originalUrl || request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
