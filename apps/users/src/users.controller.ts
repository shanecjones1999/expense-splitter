import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  FindUserByEmailDto,
  FindUserByIdDto,
  LoginDto,
  RegisterDto,
  UsersPatterns,
} from '@app/shared';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern(UsersPatterns.REGISTER)
  register(@Payload() dto: RegisterDto) {
    return this.usersService.register(dto);
  }

  @MessagePattern(UsersPatterns.LOGIN)
  login(@Payload() dto: LoginDto) {
    return this.usersService.login(dto);
  }

  @MessagePattern(UsersPatterns.FIND_BY_ID)
  findById(@Payload() dto: FindUserByIdDto) {
    return this.usersService.findById(dto.id);
  }

  @MessagePattern(UsersPatterns.FIND_BY_EMAIL)
  findByEmail(@Payload() dto: FindUserByEmailDto) {
    return this.usersService.findByEmail(dto.email);
  }
}
