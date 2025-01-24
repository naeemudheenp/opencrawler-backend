import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobProcessor } from './job.processor';
import { JobService } from './job.service';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'jobQueue',
    }),
    BullBoardModule.forFeature({
      name: 'jobQueue',
      adapter: BullMQAdapter,
    }),
  ],
  providers: [JobService, JobProcessor],
  exports: [JobService, BullModule, JobProcessor],
})
export class JobModule {}
