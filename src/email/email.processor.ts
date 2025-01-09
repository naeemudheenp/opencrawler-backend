import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('emailQueue')
export class EmailProcessor extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    setTimeout(() => {}, 100000);
    console.log('hy');
  }

  @OnWorkerEvent('completed')
  onCompleted() {
    console.log('hy');
  }
}
