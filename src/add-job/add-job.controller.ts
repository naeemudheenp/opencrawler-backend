import { Controller, Post, Body, Res } from '@nestjs/common';
import { JobService } from 'src/job/job.service';
import { Response } from 'express';
import { InterfaceJob } from 'src/interfaces';

@Controller('add-job')
export class AddJobController {
  constructor(private readonly jobService: JobService) {}
  @Post('')
  async addJob(@Body() data: InterfaceJob, @Res() res: Response) {
    const postActionApi = data?.postActionApi || null;

    const jobId = await this.jobService.addJob({
      email: data.email,
      url: data.url,
      mode: data.mode,
      postActionApi: postActionApi,
    });

    return res.status(200).json({
      text: `Job added to the queue ${jobId}`,
    });
  }
}
