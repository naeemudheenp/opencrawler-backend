import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllhamullilahController } from './allhamullilah/allhamullilah.controller';
import { TestController } from './test/test.controller';
import { GetPageStatusController } from './get-page-status/get-page-status.controller';
import { GetPageStatusUsingPuppeteerController } from './get-page-status-using-puppeteer/get-page-status-using-puppeteer.controller';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { JobModule } from './job/job.module';
import { JobProcessor } from './job/job.processor';
import { JobService } from './job/job.service';
import { SentEmailController } from './sent-email/sent-email.controller';
import { ConfigModule } from '@nestjs/config';
import { AddJobController } from './add-job/add-job.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        username: 'default',
        password: 'tAOylOZ71hyYSBLuaNdhVeJQy4ENPRY4',
      },
    }),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
    }),
    JobModule,
  ],
  controllers: [
    AppController,
    AllhamullilahController,
    GetPageStatusController,
    GetPageStatusUsingPuppeteerController,
    TestController,
    SentEmailController,
    AddJobController,
  ],
  providers: [AppService, JobModule, JobProcessor, JobService],
})
export class AppModule {}
