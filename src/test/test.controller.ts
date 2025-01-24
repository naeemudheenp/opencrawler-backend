import { Controller, Post, Body } from '@nestjs/common';
import { JobService } from 'src/job/job.service';

@Controller('test')
export class TestController {
  constructor(private readonly jobService: JobService) {}
  @Post('addJob')
  async addJob(@Body() email: any) {
    const jobId = await this.jobService.addJob({
      email: email.email,
      url: email.url,
    });
    return { message: 'Job added to the queue', jobId };
  }
}
