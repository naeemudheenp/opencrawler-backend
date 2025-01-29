import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { JobService } from 'src/job/job.service';

@Controller('test')
export class TestController {
  constructor(private readonly jobService: JobService) {}
  @Get()
  async addJob(@Query() url: { url: string }, @Res() res: Response) {
    res.status(200).json({ text: 'test' });
  }
}
