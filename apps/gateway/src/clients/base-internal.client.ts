import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { throwFromAxiosError } from '@app/shared';

type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

@Injectable()
export abstract class BaseInternalClient {
  constructor(
    protected readonly http: HttpService,
    protected readonly config: ConfigService,
  ) {}

  protected async request<T>(
    method: HttpMethod,
    baseUrl: string,
    path: string,
    data?: unknown,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = `${baseUrl}${path}`;
    const headers = {
      'X-Internal-Token': this.config.getOrThrow<string>(
        'INTERNAL_SERVICE_TOKEN',
      ),
    };

    try {
      const response = await firstValueFrom(
        this.http.request<T>({ method, url, data, params, headers }),
      );
      return response.data;
    } catch (error) {
      throwFromAxiosError(error);
    }
  }
}
