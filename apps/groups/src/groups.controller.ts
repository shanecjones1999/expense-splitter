import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AddMemberDto,
  CreateGroupDto,
  InternalAuthGuard,
  RemoveMemberDto,
} from '@app/shared';
import { GroupsService } from './groups.service';

@Controller('internal/groups')
@UseGuards(InternalAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  @Get()
  listForUser(@Query('userId', ParseUUIDPipe) userId: string) {
    return this.groupsService.listForUser(userId);
  }

  @Get(':groupId/members/:userId/verify')
  verifyMember(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.groupsService.verifyMember({ groupId, userId });
  }

  @Get(':groupId')
  findById(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('userId', new ParseUUIDPipe({ optional: true })) userId?: string,
  ) {
    return this.groupsService.findById(groupId, userId);
  }

  @Post(':groupId/members')
  addMember(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() body: Omit<AddMemberDto, 'groupId'>,
  ) {
    return this.groupsService.addMember({ ...body, groupId });
  }

  @Delete(':groupId/members/:userId')
  removeMember(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.groupsService.removeMember({ groupId, userId });
  }
}
