import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  get client(): Redis {
    return this.redis;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const payload = JSON.stringify(value);
    if (ttlSeconds) await this.redis.set(key, payload, 'EX', ttlSeconds);
    else await this.redis.set(key, payload);
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length) await this.redis.del(keys);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const stream = this.redis.scanStream({ match: pattern, count: 100 });
    for await (const keys of stream) {
      if (keys.length) await this.redis.del(keys as string[]);
    }
  }
}
