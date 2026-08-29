import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { MemberRole } from '../enums/member-role.enum';

export class CreateGroupDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsUUID()
  createdBy!: string;

  @IsOptional()
  @IsString()
  @IsIn(['USD'])
  currency?: string;
}

export class GroupIdDto {
  @IsUUID()
  groupId!: string;

  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class AddMemberDto {
  @IsUUID()
  groupId!: string;

  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsIn([MemberRole.OWNER, MemberRole.MEMBER])
  role?: MemberRole;
}

export class RemoveMemberDto {
  @IsUUID()
  groupId!: string;

  @IsUUID()
  userId!: string;
}

export class VerifyMemberDto {
  @IsUUID()
  groupId!: string;

  @IsUUID()
  userId!: string;
}

export class GroupMemberResponseDto {
  id!: string;
  userId!: string;
  role!: MemberRole;
  joinedAt!: string;
}

export class GroupResponseDto {
  id!: string;
  name!: string;
  createdBy!: string;
  currency!: string;
  createdAt!: string;
  members?: GroupMemberResponseDto[];
}
