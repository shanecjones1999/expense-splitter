import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { AuthModule } from './auth/auth.module';
import { BalancesController } from './balances/balances.controller';
import { ClientsModuleConfig } from './clients/clients.module';
import { ExpensesController } from './expenses/expenses.controller';
import { GroupsController } from './groups/groups.controller';
import { HealthController } from './health/health.controller';
import { UsersController } from './users/users.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TerminusModule,
    ClientsModuleConfig,
    AuthModule,
  ],
  controllers: [
    HealthController,
    UsersController,
    GroupsController,
    ExpensesController,
    BalancesController,
  ],
})
export class AppModule {}
