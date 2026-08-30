import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createValidationPipe } from '@app/shared';
import { UsersModule } from './users.module';

async function bootstrap() {
  const logger = new Logger('users');
  const app = await NestFactory.create(UsersModule);

  app.useGlobalPipes(createValidationPipe());

  const port = process.env.USERS_HTTP_PORT ?? 3001;
  await app.listen(port);
  logger.log(`HTTP on :${port}`);
}

bootstrap();
