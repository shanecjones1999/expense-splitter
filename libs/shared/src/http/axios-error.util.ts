import { HttpException, HttpStatus } from '@nestjs/common';
import { AxiosError } from 'axios';

export function throwFromAxiosError(error: unknown): never {
  if (error instanceof AxiosError && error.response) {
    const { status, data } = error.response;
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      data.message !== undefined
        ? data.message
        : error.message;

    throw new HttpException(
      message,
      status ?? HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  throw error;
}
