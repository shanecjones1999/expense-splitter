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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateSettlementDto } from '@app/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { BalancesClient } from '../clients/balances.client';
import { GroupsClient } from '../clients/groups.client';
import { CreateSettlementBodyDto } from './create-settlement-body.dto';

@ApiTags('balances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups/:groupId')
export class BalancesController {
  constructor(
    @Inject(BalancesClient) private readonly balancesClient: BalancesClient,
    @Inject(GroupsClient) private readonly groupsClient: GroupsClient,
  ) {}

  @Get('balances')
  async getBalances(
    @CurrentUser() user: AuthUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    await this.ensureMember(groupId, user.userId);
    return this.balancesClient.getGroupBalances(groupId);
  }

  @Get('settlements')
  async listSettlements(
    @CurrentUser() user: AuthUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    await this.ensureMember(groupId, user.userId);
    return this.balancesClient.listSettlements(groupId);
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

    return this.balancesClient.createSettlement(dto);
  }

  private async ensureMember(groupId: string, userId: string): Promise<void> {
    const result = await this.groupsClient.verifyMember(groupId, userId);
    if (!result.isMember) {
      throw new ForbiddenException('Not a group member');
    }
  }
}
