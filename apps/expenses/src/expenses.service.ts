import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import {
  CreateExpenseDto,
  EVENT_BUS,
  EventPatterns,
  ExpenseCreatedEvent,
  ExpenseDeletedEvent,
  ExpenseResponseDto,
  ExpenseUpdatedEvent,
  SplitType,
  UpdateExpenseDto,
} from '@app/shared';
import { ExpenseSplit } from './entities/expense-split.entity';
import { Expense } from './entities/expense.entity';
import { computeSplits } from './split-calculator';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(ExpenseSplit)
    private readonly splitsRepository: Repository<ExpenseSplit>,
    @Inject(EVENT_BUS) private readonly eventBus: ClientProxy,
  ) {}

  async create(dto: CreateExpenseDto): Promise<ExpenseResponseDto> {
    const computed = computeSplits(dto);
    const expense = this.expensesRepository.create({
      groupId: dto.groupId,
      description: dto.description,
      amount: dto.amount.toFixed(2),
      paidByUserId: dto.paidByUserId,
      splitType: dto.splitType,
      expenseDate: dto.expenseDate,
      splits: computed.map((split) =>
        this.splitsRepository.create({
          userId: split.userId,
          amount: split.amount.toFixed(2),
        }),
      ),
    });

    const saved = await this.expensesRepository.save(expense);
    const response = this.toResponse(saved);

    await this.emitCreated(response);
    return response;
  }

  async findById(expenseId: string): Promise<ExpenseResponseDto> {
    const expense = await this.loadExpense(expenseId);
    return this.toResponse(expense);
  }

  async listByGroup(groupId: string): Promise<ExpenseResponseDto[]> {
    const expenses = await this.expensesRepository.find({
      where: { groupId },
      relations: { splits: true },
      order: { expenseDate: 'DESC', createdAt: 'DESC' },
    });
    return expenses.map((expense) => this.toResponse(expense));
  }

  async update(dto: UpdateExpenseDto): Promise<ExpenseResponseDto> {
    const existing = await this.loadExpense(dto.expenseId);
    const previous = this.toResponse(existing);

    existing.description = dto.description ?? existing.description;
    existing.amount = (dto.amount ?? Number(existing.amount)).toFixed(2);
    existing.paidByUserId = dto.paidByUserId ?? existing.paidByUserId;
    existing.splitType = dto.splitType ?? existing.splitType;
    existing.expenseDate = dto.expenseDate ?? existing.expenseDate;

    if (dto.splits || dto.amount || dto.splitType) {
      const splitInput = dto.splits ??
        existing.splits.map((split) => ({ userId: split.userId }));
      const computed = computeSplits({
        groupId: existing.groupId,
        description: existing.description,
        amount: Number(existing.amount),
        paidByUserId: existing.paidByUserId,
        splitType: existing.splitType as SplitType,
        splits: splitInput,
        expenseDate: existing.expenseDate,
      });

      await this.splitsRepository.delete({ expenseId: existing.id });
      existing.splits = computed.map((split) =>
        this.splitsRepository.create({
          userId: split.userId,
          amount: split.amount.toFixed(2),
        }),
      );
    }

    const saved = await this.expensesRepository.save(existing);
    const current = this.toResponse(saved);

    const event: ExpenseUpdatedEvent = {
      eventId: randomUUID(),
      expenseId: current.id,
      groupId: current.groupId,
      previous: this.toEventPayload(previous),
      current: this.toEventPayload(current),
      occurredAt: new Date().toISOString(),
    };
    await firstValueFrom(
      this.eventBus.emit(EventPatterns.EXPENSE_UPDATED, event),
    );

    return current;
  }

  async delete(expenseId: string): Promise<{ deleted: true }> {
    const expense = await this.loadExpense(expenseId);
    const snapshot = this.toResponse(expense);
    await this.expensesRepository.remove(expense);

    const event: ExpenseDeletedEvent = {
      eventId: randomUUID(),
      expenseId: snapshot.id,
      groupId: snapshot.groupId,
      paidByUserId: snapshot.paidByUserId,
      amount: snapshot.amount,
      splits: snapshot.splits.map((split) => ({
        userId: split.userId,
        amount: split.amount,
      })),
      occurredAt: new Date().toISOString(),
    };
    await firstValueFrom(
      this.eventBus.emit(EventPatterns.EXPENSE_DELETED, event),
    );

    return { deleted: true };
  }

  private async emitCreated(expense: ExpenseResponseDto): Promise<void> {
    const event: ExpenseCreatedEvent = {
      eventId: randomUUID(),
      ...this.toEventPayload(expense),
      occurredAt: new Date().toISOString(),
    };
    await firstValueFrom(
      this.eventBus.emit(EventPatterns.EXPENSE_CREATED, event),
    );
  }

  private async loadExpense(expenseId: string): Promise<Expense> {
    const expense = await this.expensesRepository.findOne({
      where: { id: expenseId },
      relations: { splits: true },
    });
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    return expense;
  }

  private toEventPayload(
    expense: ExpenseResponseDto,
  ): Omit<ExpenseCreatedEvent, 'eventId' | 'occurredAt'> {
    return {
      expenseId: expense.id,
      groupId: expense.groupId,
      paidByUserId: expense.paidByUserId,
      amount: expense.amount,
      splits: expense.splits.map((split) => ({
        userId: split.userId,
        amount: split.amount,
      })),
    };
  }

  private toResponse(expense: Expense): ExpenseResponseDto {
    return {
      id: expense.id,
      groupId: expense.groupId,
      description: expense.description,
      amount: Number(expense.amount),
      paidByUserId: expense.paidByUserId,
      splitType: expense.splitType,
      expenseDate: expense.expenseDate,
      createdAt: expense.createdAt.toISOString(),
      splits: (expense.splits ?? []).map((split) => ({
        id: split.id,
        userId: split.userId,
        amount: Number(split.amount),
      })),
    };
  }
}
