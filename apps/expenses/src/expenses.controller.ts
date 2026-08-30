import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CreateExpenseDto,
  InternalAuthGuard,
  UpdateExpenseDto,
} from '@app/shared';
import { ExpensesService } from './expenses.service';

@Controller('internal')
@UseGuards(InternalAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post('expenses')
  create(@Body() dto: CreateExpenseDto) {
    return this.expensesService.create(dto);
  }

  @Get('expenses/:expenseId')
  findById(@Param('expenseId', ParseUUIDPipe) expenseId: string) {
    return this.expensesService.findById(expenseId);
  }

  @Get('groups/:groupId/expenses')
  listByGroup(@Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.expensesService.listByGroup(groupId);
  }

  @Patch('expenses/:expenseId')
  update(
    @Param('expenseId', ParseUUIDPipe) expenseId: string,
    @Body() body: Omit<UpdateExpenseDto, 'expenseId'>,
  ) {
    return this.expensesService.update({ ...body, expenseId });
  }

  @Delete('expenses/:expenseId')
  delete(@Param('expenseId', ParseUUIDPipe) expenseId: string) {
    return this.expensesService.delete(expenseId);
  }
}
