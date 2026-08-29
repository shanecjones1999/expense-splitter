import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { EVENT_BUS, redisClientProvider } from '@app/shared';
import { ExpenseSplit } from './entities/expense-split.entity';
import { Expense } from './entities/expense.entity';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('EXPENSES_DATABASE_URL'),
        entities: [Expense, ExpenseSplit],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([Expense, ExpenseSplit]),
    ClientsModule.register([redisClientProvider(EVENT_BUS)]),
    TerminusModule,
  ],
  controllers: [ExpensesController, HealthController],
  providers: [ExpensesService],
})
export class ExpensesModule {}
