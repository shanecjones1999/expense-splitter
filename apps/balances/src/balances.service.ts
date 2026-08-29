import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateSettlementDto,
  ExpenseCreatedEvent,
  ExpenseDeletedEvent,
  ExpenseUpdatedEvent,
  GroupBalanceResponseDto,
  SettlementResponseDto,
} from '@app/shared';
import { GroupBalance } from './entities/group-balance.entity';
import { ProcessedEvent } from './entities/processed-event.entity';
import { Settlement } from './entities/settlement.entity';

@Injectable()
export class BalancesService {
  constructor(
    @InjectRepository(GroupBalance)
    private readonly balancesRepository: Repository<GroupBalance>,
    @InjectRepository(Settlement)
    private readonly settlementsRepository: Repository<Settlement>,
    @InjectRepository(ProcessedEvent)
    private readonly processedEventsRepository: Repository<ProcessedEvent>,
  ) {}

  async getGroupBalances(groupId: string): Promise<GroupBalanceResponseDto[]> {
    const balances = await this.balancesRepository.find({
      where: { groupId },
      order: { userId: 'ASC' },
    });

    return balances.map((balance) => ({
      groupId: balance.groupId,
      userId: balance.userId,
      netBalance: Number(balance.netBalance),
      updatedAt: balance.updatedAt.toISOString(),
    }));
  }

  async createSettlement(
    dto: CreateSettlementDto,
  ): Promise<SettlementResponseDto> {
    if (dto.fromUserId === dto.toUserId) {
      throw new BadRequestException('Cannot settle with yourself');
    }

    const settlement = this.settlementsRepository.create({
      groupId: dto.groupId,
      fromUserId: dto.fromUserId,
      toUserId: dto.toUserId,
      amount: dto.amount.toFixed(2),
      note: dto.note ?? null,
    });
    const saved = await this.settlementsRepository.save(settlement);

    await this.adjustBalance(
      dto.groupId,
      dto.fromUserId,
      dto.amount,
    );
    await this.adjustBalance(
      dto.groupId,
      dto.toUserId,
      -dto.amount,
    );

    return this.toSettlementResponse(saved);
  }

  async listSettlements(groupId: string): Promise<SettlementResponseDto[]> {
    const settlements = await this.settlementsRepository.find({
      where: { groupId },
      order: { createdAt: 'DESC' },
    });
    return settlements.map((settlement) =>
      this.toSettlementResponse(settlement),
    );
  }

  async handleExpenseCreated(event: ExpenseCreatedEvent): Promise<void> {
    if (await this.isProcessed(event.eventId)) {
      return;
    }

    await this.applyExpenseSnapshot(event.groupId, {
      paidByUserId: event.paidByUserId,
      amount: event.amount,
      splits: event.splits,
    });
    await this.markProcessed(event.eventId, 'expense.created');
  }

  async handleExpenseUpdated(event: ExpenseUpdatedEvent): Promise<void> {
    if (await this.isProcessed(event.eventId)) {
      return;
    }

    await this.reverseExpenseSnapshot(event.groupId, event.previous);
    await this.applyExpenseSnapshot(event.groupId, event.current);
    await this.markProcessed(event.eventId, 'expense.updated');
  }

  async handleExpenseDeleted(event: ExpenseDeletedEvent): Promise<void> {
    if (await this.isProcessed(event.eventId)) {
      return;
    }

    await this.reverseExpenseSnapshot(event.groupId, {
      paidByUserId: event.paidByUserId,
      amount: event.amount,
      splits: event.splits,
    });
    await this.markProcessed(event.eventId, 'expense.deleted');
  }

  private async applyExpenseSnapshot(
    groupId: string,
    snapshot: {
      paidByUserId: string;
      amount: number;
      splits: { userId: string; amount: number }[];
    },
  ): Promise<void> {
    await this.adjustBalance(groupId, snapshot.paidByUserId, snapshot.amount);
    for (const split of snapshot.splits) {
      await this.adjustBalance(groupId, split.userId, -split.amount);
    }
  }

  private async reverseExpenseSnapshot(
    groupId: string,
    snapshot: {
      paidByUserId: string;
      amount: number;
      splits: { userId: string; amount: number }[];
    },
  ): Promise<void> {
    await this.adjustBalance(groupId, snapshot.paidByUserId, -snapshot.amount);
    for (const split of snapshot.splits) {
      await this.adjustBalance(groupId, split.userId, split.amount);
    }
  }

  private async adjustBalance(
    groupId: string,
    userId: string,
    delta: number,
  ): Promise<void> {
    let balance = await this.balancesRepository.findOne({
      where: { groupId, userId },
    });

    if (!balance) {
      balance = this.balancesRepository.create({
        groupId,
        userId,
        netBalance: '0.00',
      });
    }

    const next = round2(Number(balance.netBalance) + delta);
    balance.netBalance = next.toFixed(2);
    await this.balancesRepository.save(balance);
  }

  private async isProcessed(eventId: string): Promise<boolean> {
    const existing = await this.processedEventsRepository.findOne({
      where: { eventId },
    });
    return !!existing;
  }

  private async markProcessed(
    eventId: string,
    eventType: string,
  ): Promise<void> {
    await this.processedEventsRepository.save(
      this.processedEventsRepository.create({ eventId, eventType }),
    );
  }

  private toSettlementResponse(settlement: Settlement): SettlementResponseDto {
    if (!settlement) {
      throw new NotFoundException('Settlement not found');
    }
    return {
      id: settlement.id,
      groupId: settlement.groupId,
      fromUserId: settlement.fromUserId,
      toUserId: settlement.toUserId,
      amount: Number(settlement.amount),
      note: settlement.note,
      createdAt: settlement.createdAt.toISOString(),
    };
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
