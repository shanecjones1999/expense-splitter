import {
  Transport,
  type MicroserviceOptions,
  type RedisOptions,
} from '@nestjs/microservices';

export function redisMicroserviceOptions(): MicroserviceOptions {
  return {
    transport: Transport.REDIS,
    options: redisConnectionOptions(),
  };
}

export function redisClientProvider(
  name: string,
): RedisOptions & { name: string } {
  return {
    name,
    transport: Transport.REDIS,
    options: redisConnectionOptions(),
  };
}

function redisConnectionOptions() {
  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  };
}
