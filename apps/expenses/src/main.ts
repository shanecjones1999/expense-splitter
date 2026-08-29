import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { redisMicroserviceOptions } from '@app/shared';
import { ExpensesModule } from './expenses.module';

async function bootstrap() {
  const logger = new Logger('expenses');
  const app = await NestFactory.create(ExpensesModule);

  app.connectMicroservice<MicroserviceOptions>(redisMicroserviceOptions());
  await app.startAllMicroservices();

  const port = process.env.EXPENSES_HTTP_PORT ?? 3003;
  await app.listen(port);
  logger.log(`HTTP health on :${port}, Redis microservice connected`);
}

bootstrap();
