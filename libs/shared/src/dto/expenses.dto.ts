import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SplitType } from '../enums/split-type.enum';

export class ExpenseSplitInputDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  percentage?: number;
}

export class CreateExpenseDto {
  @IsUUID()
  groupId!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsUUID()
  paidByUserId!: string;

  @IsEnum(SplitType)
  splitType!: SplitType;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExpenseSplitInputDto)
  splits!: ExpenseSplitInputDto[];

  @IsDateString()
  expenseDate!: string;
}

export class UpdateExpenseDto {
  @IsUUID()
  expenseId!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsUUID()
  paidByUserId?: string;

  @IsOptional()
  @IsEnum(SplitType)
  splitType?: SplitType;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExpenseSplitInputDto)
  splits?: ExpenseSplitInputDto[];

  @IsOptional()
  @IsDateString()
  expenseDate?: string;
}

export class ExpenseIdDto {
  @IsUUID()
  expenseId!: string;
}

export class ListExpensesByGroupDto {
  @IsUUID()
  groupId!: string;
}

export class ExpenseSplitResponseDto {
  id!: string;
  userId!: string;
  amount!: number;
}

export class ExpenseResponseDto {
  id!: string;
  groupId!: string;
  description!: string;
  amount!: number;
  paidByUserId!: string;
  splitType!: SplitType;
  expenseDate!: string;
  createdAt!: string;
  splits!: ExpenseSplitResponseDto[];
}
