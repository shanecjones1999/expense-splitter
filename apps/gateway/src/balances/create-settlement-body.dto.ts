import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateSettlementBodyDto {
  @IsUUID()
  toUserId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
