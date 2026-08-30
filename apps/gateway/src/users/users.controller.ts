import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from '@app/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersClient } from '../clients/users.client';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(@Inject(UsersClient) private readonly usersClient: UsersClient) {}

  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersClient.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
