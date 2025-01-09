import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EmailService {
  constructor(@InjectQueue('emailQueue') private emailQueue: Queue) {}

  async sendEmail(emailData: { email: string }) {
    console.log('gotcha');

    try {
      const job = await this.emailQueue.add('sendEmail', emailData);
    } catch (error) {
      return `${error} 'error'`;
    }
    return;
    // Return the job ID for tracking
  }
}
