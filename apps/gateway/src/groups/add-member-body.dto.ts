import { IsEmail, IsOptional, IsUUID } from 'class-validator';

export class AddMemberBodyDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
