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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AddMemberDto, GroupResponseDto, UserResponseDto } from '@app/shared';
import { AddMemberBodyDto } from './add-member-body.dto';
import { CreateGroupBodyDto } from './create-group-body.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { GroupsClient } from '../clients/groups.client';
import { UsersClient } from '../clients/users.client';

@ApiTags('groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(
    @Inject(GroupsClient) private readonly groupsClient: GroupsClient,
    @Inject(UsersClient) private readonly usersClient: UsersClient,
  ) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateGroupBodyDto) {
    return this.groupsClient.create({
      ...body,
      createdBy: user.userId,
    });
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.groupsClient.listForUser(user.userId);
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.groupsClient.findById(id, user.userId);
  }

  @Post(':id/members')
  async addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AddMemberBodyDto,
  ) {
    const userId = await this.resolveMemberUserId(body);
    const dto: AddMemberDto = { groupId: id, userId };
    return this.groupsClient.addMember(dto);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.groupsClient.removeMember({ groupId: id, userId });
  }

  private async resolveMemberUserId(body: AddMemberBodyDto): Promise<string> {
    if (body.userId) {
      return body.userId;
    }
    if (!body.email) {
      throw new BadRequestException('userId or email is required');
    }

    const user = await this.usersClient.findByEmail(body.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.id;
  }
}
