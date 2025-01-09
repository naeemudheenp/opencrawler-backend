import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from './email.processor';
import { EmailService } from './email.service';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'emailQueue', // Name of the queue
    }),
    BullBoardModule.forFeature({
      name: 'emailQueue',
      adapter: BullMQAdapter, //or use BullAdapter if you're using bull instead of bullMQ
    }),
  ],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService, BullModule, EmailProcessor], // Export service for use in other modules
})
export class EmailModule {}
