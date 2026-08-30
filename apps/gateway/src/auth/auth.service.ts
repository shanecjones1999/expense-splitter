import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuthResponseDto, LoginDto, RegisterDto, UserResponseDto } from '@app/shared';
import { UsersClient } from '../clients/users.client';

@Injectable()
export class AuthService {
  constructor(@Inject(UsersClient) private readonly usersClient: UsersClient) {}

  register(dto: RegisterDto): Promise<AuthResponseDto> {
    return this.usersClient.register(dto);
  }

  login(dto: LoginDto): Promise<AuthResponseDto> {
    return this.usersClient.login(dto);
  }

  async me(userId: string): Promise<UserResponseDto> {
    const user = await this.usersClient.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
