import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateExpenseDto,
  ExpenseIdDto,
  ExpensesPatterns,
  ListExpensesByGroupDto,
  UpdateExpenseDto,
} from '@app/shared';
import { ExpensesService } from './expenses.service';

@Controller()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @MessagePattern(ExpensesPatterns.CREATE)
  create(@Payload() dto: CreateExpenseDto) {
    return this.expensesService.create(dto);
  }

  @MessagePattern(ExpensesPatterns.FIND_BY_ID)
  findById(@Payload() dto: ExpenseIdDto) {
    return this.expensesService.findById(dto.expenseId);
  }

  @MessagePattern(ExpensesPatterns.LIST_BY_GROUP)
  listByGroup(@Payload() dto: ListExpensesByGroupDto) {
    return this.expensesService.listByGroup(dto.groupId);
  }

  @MessagePattern(ExpensesPatterns.UPDATE)
  update(@Payload() dto: UpdateExpenseDto) {
    return this.expensesService.update(dto);
  }

  @MessagePattern(ExpensesPatterns.DELETE)
  delete(@Payload() dto: ExpenseIdDto) {
    return this.expensesService.delete(dto.expenseId);
  }
}
