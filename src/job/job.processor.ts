import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { modes } from './job.service';
import { deepScan } from './deepscan';
import { siteMapScan } from './sitemapscan';
import { Emailer } from 'src/emails/emailer';

@Processor('jobQueue')
export class JobProcessor extends WorkerHost {
  async process(
    job: Job<{ email: string; url: string; mode: string }, any, string>,
  ): Promise<any> {
    const emailer = new Emailer();
    emailer.sentCrawlInitiatedEmail(job.data.email);

    if (job.data.mode === modes.deepscan) {
      await deepScan(job.data.url, job.data.email);
    } else {
      await siteMapScan(job.data.url, job.data.email);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted() {}
}
