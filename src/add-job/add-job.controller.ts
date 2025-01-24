import { Controller, Post, Body, Res } from '@nestjs/common';
import { JobService } from 'src/job/job.service';
import { Response } from 'express';

@Controller('add-job')
export class AddJobController {
  constructor(private readonly jobService: JobService) {}
  @Post('')
  async addJob(@Body() data: any, @Res() res: Response) {
    const jobId = await this.jobService.addJob({
      email: data.email,
      url: data.url,
    });
    return res.status(200).json({
      text: `Job added to the queue ${jobId}`,
    });
  }
}
