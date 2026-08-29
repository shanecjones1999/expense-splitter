import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{ status: (code: number) => { json: (body: unknown) => void } }>();
    const error = exception.getError();

    if (typeof error === 'object' && error !== null && 'statusCode' in error) {
      const payload = error as { statusCode: number; message: string };
      response.status(payload.statusCode).json({
        statusCode: payload.statusCode,
        message: payload.message,
      });
      return;
    }

    if (error instanceof HttpException) {
      const status = error.getStatus();
      response.status(status).json({
        statusCode: status,
        message: error.message,
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: typeof error === 'string' ? error : 'Internal server error',
    });
  }
}
