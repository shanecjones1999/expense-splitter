import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { BalancesClient } from './balances.client';
import { ExpensesClient } from './expenses.client';
import { GroupsClient } from './groups.client';
import { UsersClient } from './users.client';

@Module({
  imports: [HttpModule.register({ timeout: 5000 })],
  providers: [UsersClient, GroupsClient, ExpensesClient, BalancesClient],
  exports: [UsersClient, GroupsClient, ExpensesClient, BalancesClient],
})
export class ClientsModuleConfig {}
