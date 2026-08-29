import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { redisMicroserviceOptions } from '@app/shared';
import { UsersModule } from './users.module';

async function bootstrap() {
  const logger = new Logger('users');
  const app = await NestFactory.create(UsersModule);

  app.connectMicroservice<MicroserviceOptions>(redisMicroserviceOptions());
  await app.startAllMicroservices();

  const port = process.env.USERS_HTTP_PORT ?? 3001;
  await app.listen(port);
  logger.log(`HTTP health on :${port}, Redis microservice connected`);
}

bootstrap();
