import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { redisClientProvider } from '@app/shared';

export const USERS_SERVICE = 'USERS_SERVICE';
export const GROUPS_SERVICE = 'GROUPS_SERVICE';
export const EXPENSES_SERVICE = 'EXPENSES_SERVICE';
export const BALANCES_SERVICE = 'BALANCES_SERVICE';

@Module({
  imports: [
    ClientsModule.register([
      redisClientProvider(USERS_SERVICE),
      redisClientProvider(GROUPS_SERVICE),
      redisClientProvider(EXPENSES_SERVICE),
      redisClientProvider(BALANCES_SERVICE),
    ]),
  ],
  exports: [ClientsModule],
})
export class ClientsModuleConfig {}
