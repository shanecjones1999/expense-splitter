import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuthResponseDto,
  InternalRoutes,
  LoginDto,
  RegisterDto,
  ServiceUrls,
  UserResponseDto,
} from '@app/shared';
import { BaseInternalClient } from './base-internal.client';

@Injectable()
export class UsersClient extends BaseInternalClient {
  constructor(http: HttpService, config: ConfigService) {
    super(http, config);
  }

  register(dto: RegisterDto): Promise<AuthResponseDto> {
    return this.request(
      'post',
      ServiceUrls.users(),
      InternalRoutes.users.register,
      dto,
    );
  }

  login(dto: LoginDto): Promise<AuthResponseDto> {
    return this.request(
      'post',
      ServiceUrls.users(),
      InternalRoutes.users.login,
      dto,
    );
  }

  findById(id: string): Promise<UserResponseDto | null> {
    return this.request(
      'get',
      ServiceUrls.users(),
      InternalRoutes.users.byId(id),
    );
  }

  findByEmail(email: string): Promise<UserResponseDto | null> {
    return this.request(
      'get',
      ServiceUrls.users(),
      InternalRoutes.users.byEmail,
      undefined,
      { email },
    );
  }
}
