import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import {
  BalancesPatterns,
  CreateSettlementDto,
  EventPatterns,
  GetGroupBalancesDto,
  ListSettlementsDto,
} from '@app/shared';
import type {
  ExpenseCreatedEvent,
  ExpenseDeletedEvent,
  ExpenseUpdatedEvent,
} from '@app/shared';
import { BalancesService } from './balances.service';

@Controller()
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @MessagePattern(BalancesPatterns.GET_GROUP)
  getGroupBalances(@Payload() dto: GetGroupBalancesDto) {
    return this.balancesService.getGroupBalances(dto.groupId);
  }

  @MessagePattern(BalancesPatterns.CREATE_SETTLEMENT)
  createSettlement(@Payload() dto: CreateSettlementDto) {
    return this.balancesService.createSettlement(dto);
  }

  @MessagePattern(BalancesPatterns.LIST_SETTLEMENTS)
  listSettlements(@Payload() dto: ListSettlementsDto) {
    return this.balancesService.listSettlements(dto.groupId);
  }

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
