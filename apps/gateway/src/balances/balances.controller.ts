import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import {
  BalancesPatterns,
  CreateSettlementDto,
  GroupBalanceResponseDto,
  GroupsPatterns,
  SettlementResponseDto,
} from '@app/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { BALANCES_SERVICE, GROUPS_SERVICE } from '../clients/clients.module';
import { CreateSettlementBodyDto } from './create-settlement-body.dto';

@ApiTags('balances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups/:groupId')
export class BalancesController {
  constructor(
    @Inject(BALANCES_SERVICE) private readonly balancesClient: ClientProxy,
    @Inject(GROUPS_SERVICE) private readonly groupsClient: ClientProxy,
  ) {}

  @Get('balances')
  async getBalances(
    @CurrentUser() user: AuthUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    await this.ensureMember(groupId, user.userId);
    return firstValueFrom(
      this.balancesClient.send<GroupBalanceResponseDto[]>(
        BalancesPatterns.GET_GROUP,
        { groupId },
      ),
    );
  }

  @Get('settlements')
  async listSettlements(
    @CurrentUser() user: AuthUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    await this.ensureMember(groupId, user.userId);
    return firstValueFrom(
      this.balancesClient.send<SettlementResponseDto[]>(
        BalancesPatterns.LIST_SETTLEMENTS,
        { groupId },
      ),
    );
  }

  @Post('settlements')
  async createSettlement(
    @CurrentUser() user: AuthUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() body: CreateSettlementBodyDto,
  ) {
    await this.ensureMember(groupId, user.userId);

    const dto: CreateSettlementDto = {
      groupId,
      fromUserId: user.userId,
      toUserId: body.toUserId,
      amount: body.amount,
      note: body.note,
    };

    return firstValueFrom(
      this.balancesClient.send<SettlementResponseDto>(
        BalancesPatterns.CREATE_SETTLEMENT,
        dto,
      ),
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
