import { Module } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { LeavesController } from './leaves.controller';
import { PrismaService } from '../../services/prisma.service';

@Module({
  controllers: [LeavesController],
  providers: [LeavesService, PrismaService],
  exports: [LeavesService],
})
export class LeavesModule {}
