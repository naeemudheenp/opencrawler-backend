import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class JobService {
  constructor(@InjectQueue('jobQueue') private readonly emailQueue: Queue) {}

  async addJob(emailData: { email: string; url: string }) {
    try {
      await fetch(
        `${process.env.BACKEND_URL}/sent-email?email=${emailData.email}`,
      );
      await this.emailQueue.add('addJob', emailData);
    } catch (error) {
      return `${error} 'error'`;
    }
  }
}
