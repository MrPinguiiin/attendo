import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: RedisClientType;

  constructor(private configService: ConfigService) {
    this.client = createClient({
      socket: {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
      },
      password: this.configService.get('REDIS_PASSWORD') || undefined,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    this.client.connect().catch(console.error);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async expire(key: string, ttl: number): Promise<number> {
    return await this.client.expire(key, ttl);
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<number> {
    return await this.client.hSet(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return await this.client.hGet(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.client.hGetAll(key);
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    return await this.client.hDel(key, fields);
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    return await this.client.lPush(key, values);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    return await this.client.rPush(key, values);
  }

  async lrange(key: string, start: number, end: number): Promise<string[]> {
    return await this.client.lRange(key, start, end);
  }

  async lpop(key: string): Promise<string | null> {
    return await this.client.lPop(key);
  }

  async rpop(key: string): Promise<string | null> {
    return await this.client.rPop(key);
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    return await this.client.sAdd(key, members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return await this.client.sRem(key, members);
  }

  async smembers(key: string): Promise<string[]> {
    return await this.client.sMembers(key);
  }

  async sismember(key: string, member: string): Promise<number> {
    return await this.client.sIsMember(key, member) ? 1 : 0;
  }
}
