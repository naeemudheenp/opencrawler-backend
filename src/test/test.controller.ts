import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { deepScan } from 'src/job/deepscan';
import { JobService } from 'src/job/job.service';

@Controller('test')
export class TestController {
  constructor(private readonly jobService: JobService) {}
  @Get()
  async addJob(@Query() url: { url: string }, @Res() res: Response) {
    const response = await deepScan(url.url);
    res.status(200).json({
      response,
    });
  }
}
