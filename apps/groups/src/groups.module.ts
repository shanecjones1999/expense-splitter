import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { GroupMember } from './entities/group-member.entity';
import { Group } from './entities/group.entity';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('GROUPS_DATABASE_URL'),
        entities: [Group, GroupMember],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([Group, GroupMember]),
    TerminusModule,
  ],
  controllers: [GroupsController, HealthController],
  providers: [GroupsService],
})
export class GroupsModule {}
