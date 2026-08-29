import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import {
  ExpenseResponseDto,
  ExpensesPatterns,
  GroupsPatterns,
  UpdateExpenseDto,
} from '@app/shared';
import { CreateExpenseBodyDto } from './create-expense-body.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { EXPENSES_SERVICE, GROUPS_SERVICE } from '../clients/clients.module';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ExpensesController {
  constructor(
    @Inject(EXPENSES_SERVICE) private readonly expensesClient: ClientProxy,
    @Inject(GROUPS_SERVICE) private readonly groupsClient: ClientProxy,
  ) {}

  @Post('groups/:groupId/expenses')
  async create(
    @CurrentUser() user: AuthUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() body: CreateExpenseBodyDto,
  ) {
    await this.ensureMember(groupId, user.userId);
    return firstValueFrom(
      this.expensesClient.send<ExpenseResponseDto>(ExpensesPatterns.CREATE, {
        ...body,
        groupId,
      }),
    );
  }

  @Get('groups/:groupId/expenses')
  async listByGroup(
    @CurrentUser() user: AuthUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    await this.ensureMember(groupId, user.userId);
    return firstValueFrom(
      this.expensesClient.send<ExpenseResponseDto[]>(
        ExpensesPatterns.LIST_BY_GROUP,
        { groupId },
      ),
    );
  }

  @Get('expenses/:id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return firstValueFrom(
      this.expensesClient.send<ExpenseResponseDto>(ExpensesPatterns.FIND_BY_ID, {
        expenseId: id,
      }),
    );
  }

  @Patch('expenses/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Omit<UpdateExpenseDto, 'expenseId'>,
  ) {
    return firstValueFrom(
      this.expensesClient.send<ExpenseResponseDto>(ExpensesPatterns.UPDATE, {
        ...body,
        expenseId: id,
      }),
    );
  }

  @Delete('expenses/:id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return firstValueFrom(
      this.expensesClient.send(ExpensesPatterns.DELETE, { expenseId: id }),
    );
  }

  private async ensureMember(groupId: string, userId: string): Promise<void> {
    const result = await firstValueFrom(
      this.groupsClient.send<{ isMember: boolean }>(
        GroupsPatterns.VERIFY_MEMBER,
        { groupId, userId },
      ),
    );
    if (!result.isMember) {
      throw new ForbiddenException('Not a group member');
    }
  }
}
