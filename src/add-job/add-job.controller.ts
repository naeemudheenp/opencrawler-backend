import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from 'src/email/email.service';

@Controller('add-job')
export class AddJobController {
  constructor(private readonly emailService: EmailService) {}
  @Post('')
  async addJob(@Body() email: any) {
    const jobId = await this.emailService.sendEmail({
      email: email.email,
      url: email.url,
    });
    return { message: 'Job added to the queue', jobId };
  }
}
