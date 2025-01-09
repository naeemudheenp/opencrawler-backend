import { Controller, Get, Res, Post, Body, Injectable } from '@nestjs/common';
import { Response, response } from 'express';
import { FetchUsingUrlService } from 'src/fetch-using-url/fetch-using-url.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EmailService } from 'src/email/email.service';

@Controller('test')
export class TestController {
  constructor(private readonly emailService: EmailService) {}

  // @Get()
  // // async test(@Res() res: Response) {
  // //   const { brokenUrl, allPages } =
  // //     await this.fetchUsingUrlService.crawlSitemap(
  // //       'https://surveysparrow.com/webinars/sitemap.xml',
  // //     );
  // //   return res.status(200).json({ brokenUrl, allPages });
  // // }
  @Post('sendEmail')
  async sendEmail(@Body() email: any) {
    const jobId = await this.emailService.sendEmail({
      email: email.email,
    });

    return { message: 'Job added to the queue', jobId };
  }
}
