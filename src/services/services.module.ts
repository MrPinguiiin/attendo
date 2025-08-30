import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { CacheService } from './cache.service';
import { PrismaService } from './prisma.service';

@Module({
  imports: [ConfigModule],
  providers: [RedisService, CacheService, PrismaService],
  exports: [RedisService, CacheService, PrismaService],
})
export class ServicesModule {}
