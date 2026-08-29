import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import {
  AddMemberDto,
  GroupResponseDto,
  GroupsPatterns,
  UserResponseDto,
  UsersPatterns,
} from '@app/shared';
import { AddMemberBodyDto } from './add-member-body.dto';
import { CreateGroupBodyDto } from './create-group-body.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { GROUPS_SERVICE, USERS_SERVICE } from '../clients/clients.module';

@ApiTags('groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(
    @Inject(GROUPS_SERVICE) private readonly groupsClient: ClientProxy,
    @Inject(USERS_SERVICE) private readonly usersClient: ClientProxy,
  ) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateGroupBodyDto) {
    return firstValueFrom(
      this.groupsClient.send<GroupResponseDto>(GroupsPatterns.CREATE, {
        ...body,
        createdBy: user.userId,
      }),
    );
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return firstValueFrom(
      this.groupsClient.send<GroupResponseDto[]>(GroupsPatterns.LIST_FOR_USER, {
        userId: user.userId,
      }),
    );
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return firstValueFrom(
      this.groupsClient.send<GroupResponseDto>(GroupsPatterns.FIND_BY_ID, {
        groupId: id,
        userId: user.userId,
      }),
    );
  }

  @Post(':id/members')
  async addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AddMemberBodyDto,
  ) {
    const userId = await this.resolveMemberUserId(body);
    const dto: AddMemberDto = { groupId: id, userId };
    return firstValueFrom(
      this.groupsClient.send<GroupResponseDto>(GroupsPatterns.ADD_MEMBER, dto),
    );
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return firstValueFrom(
      this.groupsClient.send<GroupResponseDto>(GroupsPatterns.REMOVE_MEMBER, {
        groupId: id,
        userId,
      }),
    );
  }

  private async resolveMemberUserId(body: AddMemberBodyDto): Promise<string> {
    if (body.userId) {
      return body.userId;
    }
    if (!body.email) {
      throw new BadRequestException('userId or email is required');
    }

    const user = await firstValueFrom(
      this.usersClient.send<UserResponseDto | null>(
        UsersPatterns.FIND_BY_EMAIL,
        { email: body.email },
      ),
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.id;
  }
}
