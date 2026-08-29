import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AddMemberDto,
  CreateGroupDto,
  GroupIdDto,
  GroupsPatterns,
  RemoveMemberDto,
  VerifyMemberDto,
} from '@app/shared';
import { GroupsService } from './groups.service';

@Controller()
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @MessagePattern(GroupsPatterns.CREATE)
  create(@Payload() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  @MessagePattern(GroupsPatterns.FIND_BY_ID)
  findById(@Payload() dto: GroupIdDto) {
    return this.groupsService.findById(dto.groupId, dto.userId);
  }

  @MessagePattern(GroupsPatterns.LIST_FOR_USER)
  listForUser(@Payload() dto: { userId: string }) {
    return this.groupsService.listForUser(dto.userId);
  }

  @MessagePattern(GroupsPatterns.ADD_MEMBER)
  addMember(@Payload() dto: AddMemberDto) {
    return this.groupsService.addMember(dto);
  }

  @MessagePattern(GroupsPatterns.REMOVE_MEMBER)
  removeMember(@Payload() dto: RemoveMemberDto) {
    return this.groupsService.removeMember(dto);
  }

  @MessagePattern(GroupsPatterns.VERIFY_MEMBER)
  verifyMember(@Payload() dto: VerifyMemberDto) {
    return this.groupsService.verifyMember(dto);
  }
}
