import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EventPatterns } from '@app/shared';
import type {
  ExpenseCreatedEvent,
  ExpenseDeletedEvent,
  ExpenseUpdatedEvent,
} from '@app/shared';
import { BalancesService } from './balances.service';

@Controller()
export class BalancesEventsController {
  constructor(private readonly balancesService: BalancesService) {}

  @EventPattern(EventPatterns.EXPENSE_CREATED)
  onExpenseCreated(@Payload() event: ExpenseCreatedEvent) {
    return this.balancesService.handleExpenseCreated(event);
  }

  @EventPattern(EventPatterns.EXPENSE_UPDATED)
  onExpenseUpdated(@Payload() event: ExpenseUpdatedEvent) {
    return this.balancesService.handleExpenseUpdated(event);
  }

  @EventPattern(EventPatterns.EXPENSE_DELETED)
  onExpenseDeleted(@Payload() event: ExpenseDeletedEvent) {
    return this.balancesService.handleExpenseDeleted(event);
  }
}
