import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllhamullilahController } from './allhamullilah/allhamullilah.controller';
import { GetPageStatusController } from './get-page-status/get-page-status.controller';

@Module({
  imports: [],
  controllers: [AppController, AllhamullilahController, GetPageStatusController],
  providers: [AppService],
})
export class AppModule {}
