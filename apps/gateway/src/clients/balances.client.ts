import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateSettlementDto,
  GroupBalanceResponseDto,
  InternalRoutes,
  ServiceUrls,
  SettlementResponseDto,
} from '@app/shared';
import { BaseInternalClient } from './base-internal.client';

@Injectable()
export class BalancesClient extends BaseInternalClient {
  constructor(http: HttpService, config: ConfigService) {
    super(http, config);
  }

  getGroupBalances(groupId: string): Promise<GroupBalanceResponseDto[]> {
    return this.request(
      'get',
      ServiceUrls.balances(),
      InternalRoutes.balances.groupBalances(groupId),
    );
  }

  listSettlements(groupId: string): Promise<SettlementResponseDto[]> {
    return this.request(
      'get',
      ServiceUrls.balances(),
      InternalRoutes.balances.settlements(groupId),
    );
  }

  createSettlement(dto: CreateSettlementDto): Promise<SettlementResponseDto> {
    return this.request(
      'post',
      ServiceUrls.balances(),
      InternalRoutes.balances.settlements(dto.groupId),
      dto,
    );
  }
}
