import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  AuthResponseDto,
  LoginDto,
  RegisterDto,
  UserResponseDto,
  UsersPatterns,
} from '@app/shared';
import { USERS_SERVICE } from '../clients/clients.module';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USERS_SERVICE) private readonly usersClient: ClientProxy,
  ) {}

  register(dto: RegisterDto): Promise<AuthResponseDto> {
    return firstValueFrom(
      this.usersClient.send<AuthResponseDto>(UsersPatterns.REGISTER, dto),
    );
  }

  login(dto: LoginDto): Promise<AuthResponseDto> {
    return firstValueFrom(
      this.usersClient.send<AuthResponseDto>(UsersPatterns.LOGIN, dto),
    );
  }

  async me(userId: string): Promise<UserResponseDto> {
    const user = await firstValueFrom(
      this.usersClient.send<UserResponseDto | null>(UsersPatterns.FIND_BY_ID, {
        id: userId,
      }),
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
