import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createValidationPipe } from '@app/shared';
import { GroupsModule } from './groups.module';

async function bootstrap() {
  const logger = new Logger('groups');
  const app = await NestFactory.create(GroupsModule);

  app.useGlobalPipes(createValidationPipe());

  const port = process.env.GROUPS_HTTP_PORT ?? 3002;
  await app.listen(port);
  logger.log(`HTTP on :${port}`);
}

bootstrap();
