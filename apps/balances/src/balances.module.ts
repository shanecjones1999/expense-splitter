import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { GroupBalance } from './entities/group-balance.entity';
import { ProcessedEvent } from './entities/processed-event.entity';
import { Settlement } from './entities/settlement.entity';
import { BalancesEventsController } from './balances-events.controller';
import { BalancesService } from './balances.service';
import { HealthController } from './health.controller';
import { InternalBalancesController } from './internal-balances.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('BALANCES_DATABASE_URL'),
        entities: [GroupBalance, Settlement, ProcessedEvent],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([GroupBalance, Settlement, ProcessedEvent]),
    TerminusModule,
  ],
  controllers: [
    InternalBalancesController,
    BalancesEventsController,
    HealthController,
  ],
  providers: [BalancesService],
})
export class BalancesModule {}
