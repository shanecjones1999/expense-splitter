import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { redisMicroserviceOptions } from '@app/shared';
import { GroupsModule } from './groups.module';

async function bootstrap() {
  const logger = new Logger('groups');
  const app = await NestFactory.create(GroupsModule);

  app.connectMicroservice<MicroserviceOptions>(redisMicroserviceOptions());
  await app.startAllMicroservices();

  const port = process.env.GROUPS_HTTP_PORT ?? 3002;
  await app.listen(port);
  logger.log(`HTTP health on :${port}, Redis microservice connected`);
}

bootstrap();
