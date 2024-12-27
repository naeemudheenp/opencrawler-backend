import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllhamullilahController } from './allhamullilah/allhamullilah.controller';
import { GetPageStatusController } from './get-page-status/get-page-status.controller';
import { GetPageStatusUsingPuppeteerController } from './get-page-status-using-puppeteer/get-page-status-using-puppeteer.controller';

@Module({
  imports: [],
  controllers: [AppController, AllhamullilahController, GetPageStatusController, GetPageStatusUsingPuppeteerController],
  providers: [AppService],
})
export class AppModule {}
