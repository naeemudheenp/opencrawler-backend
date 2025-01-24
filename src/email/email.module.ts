import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from './email.processor';
import { EmailService } from './email.service';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'emailQueue',
    }),
    BullBoardModule.forFeature({
      name: 'emailQueue',
      adapter: BullMQAdapter,
    }),
  ],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService, BullModule, EmailProcessor],
})
export class EmailModule {}
