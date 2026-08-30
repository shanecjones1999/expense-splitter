import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateExpenseDto,
  ExpenseResponseDto,
  InternalRoutes,
  ServiceUrls,
  UpdateExpenseDto,
} from '@app/shared';
import { BaseInternalClient } from './base-internal.client';

@Injectable()
export class ExpensesClient extends BaseInternalClient {
  constructor(http: HttpService, config: ConfigService) {
    super(http, config);
  }

  create(dto: CreateExpenseDto): Promise<ExpenseResponseDto> {
    return this.request(
      'post',
      ServiceUrls.expenses(),
      InternalRoutes.expenses.create,
      dto,
    );
  }

  findById(expenseId: string): Promise<ExpenseResponseDto> {
    return this.request(
      'get',
      ServiceUrls.expenses(),
      InternalRoutes.expenses.byId(expenseId),
    );
  }

  listByGroup(groupId: string): Promise<ExpenseResponseDto[]> {
    return this.request(
      'get',
      ServiceUrls.expenses(),
      InternalRoutes.expenses.listByGroup(groupId),
    );
  }

  update(dto: UpdateExpenseDto): Promise<ExpenseResponseDto> {
    const { expenseId, ...body } = dto;
    return this.request(
      'patch',
      ServiceUrls.expenses(),
      InternalRoutes.expenses.byId(expenseId),
      body,
    );
  }

  delete(expenseId: string): Promise<void> {
    return this.request(
      'delete',
      ServiceUrls.expenses(),
      InternalRoutes.expenses.byId(expenseId),
    );
  }
}
