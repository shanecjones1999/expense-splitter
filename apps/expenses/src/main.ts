import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createValidationPipe } from '@app/shared';
import { ExpensesModule } from './expenses.module';

async function bootstrap() {
  const logger = new Logger('expenses');
  const app = await NestFactory.create(ExpensesModule);

  app.useGlobalPipes(createValidationPipe());

  const port = process.env.EXPENSES_HTTP_PORT ?? 3003;
  await app.listen(port);
  logger.log(`HTTP on :${port}`);
}

bootstrap();
