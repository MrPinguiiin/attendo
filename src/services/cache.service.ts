import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class CacheService {
  constructor(private redisService: RedisService) {}

  private getCacheKey(prefix: string, key: string): string {
    return `${prefix}:${key}`;
  }

  async setUser(userId: string, userData: any, ttl: number = 3600): Promise<void> {
    const key = this.getCacheKey('user', userId);
    await this.redisService.set(key, JSON.stringify(userData), ttl);
  }

  async getUser(userId: string): Promise<any | null> {
    const key = this.getCacheKey('user', userId);
    const data = await this.redisService.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteUser(userId: string): Promise<void> {
    const key = this.getCacheKey('user', userId);
    await this.redisService.del(key);
  }

  async setCompany(companyId: string, companyData: any, ttl: number = 3600): Promise<void> {
    const key = this.getCacheKey('company', companyId);
    await this.redisService.set(key, JSON.stringify(companyData), ttl);
  }

  async getCompany(companyId: string): Promise<any | null> {
    const key = this.getCacheKey('company', companyId);
    const data = await this.redisService.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteCompany(companyId: string): Promise<void> {
    const key = this.getCacheKey('company', companyId);
    await this.redisService.del(key);
  }

  async setAttendance(attendanceId: string, attendanceData: any, ttl: number = 1800): Promise<void> {
    const key = this.getCacheKey('attendance', attendanceId);
    await this.redisService.set(key, JSON.stringify(attendanceData), ttl);
  }

  async getAttendance(attendanceId: string): Promise<any | null> {
    const key = this.getCacheKey('attendance', attendanceId);
    const data = await this.redisService.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteAttendance(attendanceId: string): Promise<void> {
    const key = this.getCacheKey('attendance', attendanceId);
    await this.redisService.del(key);
  }

  async setSession(sessionId: string, sessionData: any, ttl: number = 86400): Promise<void> {
    const key = this.getCacheKey('session', sessionId);
    await this.redisService.set(key, JSON.stringify(sessionData), ttl);
  }

  async getSession(sessionId: string): Promise<any | null> {
    const key = this.getCacheKey('session', sessionId);
    const data = await this.redisService.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = this.getCacheKey('session', sessionId);
    await this.redisService.del(key);
  }

  async incrementRequestCount(identifier: string, windowMs: number = 900000): Promise<number> {
    const key = this.getCacheKey('ratelimit', identifier);
    const current = await this.redisService.get(key);
    const count = current ? parseInt(current) + 1 : 1;
    await this.redisService.set(key, count.toString(), Math.floor(windowMs / 1000));
    return count;
  }

  async getRequestCount(identifier: string): Promise<number> {
    const key = this.getCacheKey('ratelimit', identifier);
    const count = await this.redisService.get(key);
    return count ? parseInt(count) : 0;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const cacheKey = this.getCacheKey('general', key);
    await this.redisService.set(cacheKey, JSON.stringify(value), ttl);
  }

  async get(key: string): Promise<any | null> {
    const cacheKey = this.getCacheKey('general', key);
    const data = await this.redisService.get(cacheKey);
    return data ? JSON.parse(data) : null;
  }

  async delete(key: string): Promise<void> {
    const cacheKey = this.getCacheKey('general', key);
    await this.redisService.del(cacheKey);
  }

  async clearPattern(pattern: string): Promise<void> {
    const keys = await this.redisService.get(`pattern:${pattern}`);
    if (keys) {
      const keyArray = JSON.parse(keys);
      for (const key of keyArray) {
        await this.redisService.del(key);
      }
    }
  }
}
