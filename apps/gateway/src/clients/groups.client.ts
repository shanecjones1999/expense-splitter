import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AddMemberDto,
  CreateGroupDto,
  GroupResponseDto,
  InternalRoutes,
  RemoveMemberDto,
  ServiceUrls,
} from '@app/shared';
import { BaseInternalClient } from './base-internal.client';

@Injectable()
export class GroupsClient extends BaseInternalClient {
  constructor(http: HttpService, config: ConfigService) {
    super(http, config);
  }

  create(dto: CreateGroupDto): Promise<GroupResponseDto> {
    return this.request(
      'post',
      ServiceUrls.groups(),
      InternalRoutes.groups.create,
      dto,
    );
  }

  listForUser(userId: string): Promise<GroupResponseDto[]> {
    return this.request(
      'get',
      ServiceUrls.groups(),
      InternalRoutes.groups.list,
      undefined,
      { userId },
    );
  }

  findById(groupId: string, userId?: string): Promise<GroupResponseDto> {
    return this.request(
      'get',
      ServiceUrls.groups(),
      InternalRoutes.groups.byId(groupId),
      undefined,
      userId ? { userId } : undefined,
    );
  }

  addMember(dto: AddMemberDto): Promise<GroupResponseDto> {
    return this.request(
      'post',
      ServiceUrls.groups(),
      InternalRoutes.groups.addMember(dto.groupId),
      dto,
    );
  }

  removeMember(dto: RemoveMemberDto): Promise<GroupResponseDto> {
    return this.request(
      'delete',
      ServiceUrls.groups(),
      InternalRoutes.groups.removeMember(dto.groupId, dto.userId),
    );
  }

  verifyMember(
    groupId: string,
    userId: string,
  ): Promise<{ isMember: boolean }> {
    return this.request(
      'get',
      ServiceUrls.groups(),
      InternalRoutes.groups.verifyMember(groupId, userId),
    );
  }
}
