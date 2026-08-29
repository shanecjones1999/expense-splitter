import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { UserResponseDto, UsersPatterns } from '@app/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { USERS_SERVICE } from '../clients/clients.module';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    @Inject(USERS_SERVICE) private readonly usersClient: ClientProxy,
  ) {}

  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    const user = await firstValueFrom(
      this.usersClient.send<UserResponseDto | null>(UsersPatterns.FIND_BY_ID, {
        id,
      }),
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
