import { Controller, Get } from '@nestjs/common';

@Controller('allhamullilah')
export class AllhamullilahController {
  @Get()
  findAll() {
    return 'allhamullilah..its just a begining....';
  }
}
