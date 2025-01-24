import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EmailService {
  constructor(@InjectQueue('emailQueue') private readonly emailQueue: Queue) {}

  async sendEmail(emailData: { email: string; url: string }) {
    try {
      await fetch(
        `${process.env.BACKEND_URL}/sent-email?email=${emailData.email}`,
      );
      await this.emailQueue.add('sendEmail', emailData);
    } catch (error) {
      return `${error} 'error'`;
    }
  }
}
