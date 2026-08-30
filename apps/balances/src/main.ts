import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { createValidationPipe, redisMicroserviceOptions } from '@app/shared';
import { BalancesModule } from './balances.module';

async function bootstrap() {
  const logger = new Logger('balances');
  const app = await NestFactory.create(BalancesModule);

  app.useGlobalPipes(createValidationPipe());
  app.connectMicroservice<MicroserviceOptions>(redisMicroserviceOptions());
  await app.startAllMicroservices();

  const port = process.env.BALANCES_HTTP_PORT ?? 3004;
  await app.listen(port);
  logger.log(`HTTP on :${port}, Redis events connected`);
}

bootstrap();
