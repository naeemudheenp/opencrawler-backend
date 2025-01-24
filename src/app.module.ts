import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllhamullilahController } from './allhamullilah/allhamullilah.controller';
import { TestController } from './test/test.controller';
import { GetPageStatusController } from './get-page-status/get-page-status.controller';
import { GetPageStatusUsingPuppeteerController } from './get-page-status-using-puppeteer/get-page-status-using-puppeteer.controller';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express'; // Use FastifyAdapter if using Fastify
import { EmailModule } from './email/email.module';
import { EmailProcessor } from './email/email.processor';
import { EmailService } from './email/email.service';
import { SentEmailController } from './sent-email/sent-email.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
    }),
    BullBoardModule.forRoot({
      route: '/queues', // Base route for the dashboard
      adapter: ExpressAdapter, // Or FastifyAdapter
    }),
    EmailModule, // Include your custom module here
  ],
  controllers: [
    AppController,
    AllhamullilahController,
    GetPageStatusController,
    GetPageStatusUsingPuppeteerController,
    TestController,
    SentEmailController,
  ],
  providers: [AppService, EmailModule, EmailProcessor, EmailService],
})
export class AppModule {}
