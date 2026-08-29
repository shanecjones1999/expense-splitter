import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AddMemberDto,
  CreateGroupDto,
  GroupMemberResponseDto,
  GroupResponseDto,
  MemberRole,
  RemoveMemberDto,
  VerifyMemberDto,
} from '@app/shared';
import { GroupMember } from './entities/group-member.entity';
import { Group } from './entities/group.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly membersRepository: Repository<GroupMember>,
  ) {}

  async create(dto: CreateGroupDto): Promise<GroupResponseDto> {
    const group = this.groupsRepository.create({
      name: dto.name,
      createdBy: dto.createdBy,
      currency: dto.currency ?? 'USD',
    });
    const saved = await this.groupsRepository.save(group);

    await this.membersRepository.save(
      this.membersRepository.create({
        groupId: saved.id,
        userId: dto.createdBy,
        role: MemberRole.OWNER,
      }),
    );

    return this.findById(saved.id, dto.createdBy);
  }

  async findById(groupId: string, userId?: string): Promise<GroupResponseDto> {
    const group = await this.groupsRepository.findOne({
      where: { id: groupId },
      relations: { members: true },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    if (userId) {
      await this.ensureMember(groupId, userId);
    }
    return this.toResponse(group);
  }

  async listForUser(userId: string): Promise<GroupResponseDto[]> {
    const memberships = await this.membersRepository.find({
      where: { userId },
    });
    if (memberships.length === 0) {
      return [];
    }

    const groups = await this.groupsRepository.find({
      where: memberships.map((m) => ({ id: m.groupId })),
      relations: { members: true },
      order: { createdAt: 'DESC' },
    });

    return groups.map((group) => this.toResponse(group));
  }

  async addMember(dto: AddMemberDto): Promise<GroupResponseDto> {
    await this.findById(dto.groupId);
    const existing = await this.membersRepository.findOne({
      where: { groupId: dto.groupId, userId: dto.userId },
    });
    if (existing) {
      throw new ConflictException('User is already a member');
    }

    await this.membersRepository.save(
      this.membersRepository.create({
        groupId: dto.groupId,
        userId: dto.userId,
        role: dto.role ?? MemberRole.MEMBER,
      }),
    );

    return this.findById(dto.groupId);
  }

  async removeMember(dto: RemoveMemberDto): Promise<GroupResponseDto> {
    const member = await this.membersRepository.findOne({
      where: { groupId: dto.groupId, userId: dto.userId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    await this.membersRepository.remove(member);
    return this.findById(dto.groupId);
  }

  async verifyMember(dto: VerifyMemberDto): Promise<{ isMember: boolean }> {
    const member = await this.membersRepository.findOne({
      where: { groupId: dto.groupId, userId: dto.userId },
    });
    return { isMember: !!member };
  }

  private async ensureMember(groupId: string, userId: string): Promise<void> {
    const { isMember } = await this.verifyMember({ groupId, userId });
    if (!isMember) {
      throw new NotFoundException('Group not found');
    }
  }

  private toResponse(group: Group): GroupResponseDto {
    return {
      id: group.id,
      name: group.name,
      createdBy: group.createdBy,
      currency: group.currency,
      createdAt: group.createdAt.toISOString(),
      members: (group.members ?? []).map(
        (member): GroupMemberResponseDto => ({
          id: member.id,
          userId: member.userId,
          role: member.role,
          joinedAt: member.joinedAt.toISOString(),
        }),
      ),
    };
  }
}
