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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExpenseResponseDto, UpdateExpenseDto } from '@app/shared';
import { CreateExpenseBodyDto } from './create-expense-body.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { ExpensesClient } from '../clients/expenses.client';
import { GroupsClient } from '../clients/groups.client';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ExpensesController {
  constructor(
    @Inject(ExpensesClient) private readonly expensesClient: ExpensesClient,
    @Inject(GroupsClient) private readonly groupsClient: GroupsClient,
  ) {}

  @Post('groups/:groupId/expenses')
  async create(
    @CurrentUser() user: AuthUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() body: CreateExpenseBodyDto,
  ) {
    await this.ensureMember(groupId, user.userId);
    return this.expensesClient.create({
      ...body,
      groupId,
    });
  }

  @Get('groups/:groupId/expenses')
  async listByGroup(
    @CurrentUser() user: AuthUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    await this.ensureMember(groupId, user.userId);
    return this.expensesClient.listByGroup(groupId);
  }

  @Get('expenses/:id')
  async getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const expense = await this.expensesClient.findById(id);
    await this.ensureMember(expense.groupId, user.userId);
    return expense;
  }

  @Patch('expenses/:id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Omit<UpdateExpenseDto, 'expenseId'>,
  ) {
    const expense = await this.expensesClient.findById(id);
    await this.ensureMember(expense.groupId, user.userId);
    return this.expensesClient.update({
      ...body,
      expenseId: id,
    });
  }

  @Delete('expenses/:id')
  async delete(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const expense = await this.expensesClient.findById(id);
    await this.ensureMember(expense.groupId, user.userId);
    return this.expensesClient.delete(id);
  }

  private async ensureMember(groupId: string, userId: string): Promise<void> {
    const result = await this.groupsClient.verifyMember(groupId, userId);
    if (!result.isMember) {
      throw new ForbiddenException('Not a group member');
    }
  }
}
