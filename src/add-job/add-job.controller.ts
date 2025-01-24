import { Controller, Post, Body } from '@nestjs/common';
import { JobService } from 'src/job/job.service';

@Controller('add-job')
export class AddJobController {
  constructor(private readonly jobService: JobService) {}
  @Post('')
  async addJob(@Body() data: any) {
    const jobId = await this.jobService.addJob({
      email: data.email,
      url: data.url,
    });
    return { message: 'Job added to the queue', jobId };
  }
}
