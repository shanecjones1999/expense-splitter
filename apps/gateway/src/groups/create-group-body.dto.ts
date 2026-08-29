import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateGroupBodyDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  @IsIn(['USD'])
  currency?: string;
}
