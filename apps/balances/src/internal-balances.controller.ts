import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CreateSettlementDto,
  InternalAuthGuard,
} from '@app/shared';
import { BalancesService } from './balances.service';

@Controller('internal/groups/:groupId')
@UseGuards(InternalAuthGuard)
export class InternalBalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get('balances')
  getGroupBalances(@Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.balancesService.getGroupBalances(groupId);
  }

  @Get('settlements')
  listSettlements(@Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.balancesService.listSettlements(groupId);
  }

  @Post('settlements')
  createSettlement(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() body: Omit<CreateSettlementDto, 'groupId'>,
  ) {
    return this.balancesService.createSettlement({ ...body, groupId });
  }
}
