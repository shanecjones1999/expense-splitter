import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class GetGroupBalancesDto {
  @IsUUID()
  groupId!: string;
}

export class CreateSettlementDto {
  @IsUUID()
  groupId!: string;

  @IsUUID()
  fromUserId!: string;

  @IsUUID()
  toUserId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class ListSettlementsDto {
  @IsUUID()
  groupId!: string;
}

export class GroupBalanceResponseDto {
  groupId!: string;
  userId!: string;
  netBalance!: number;
  updatedAt!: string;
}

export class SettlementResponseDto {
  id!: string;
  groupId!: string;
  fromUserId!: string;
  toUserId!: string;
  amount!: number;
  note!: string | null;
  createdAt!: string;
}
