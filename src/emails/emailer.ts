import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { EmailTemplates } from './emails';
import { InterfaceEmailTemplates } from 'src/interfaces';

@Injectable()
export class Emailer {
  private readonly resend: Resend;
  private readonly emailContent: InterfaceEmailTemplates;
  constructor() {
    this.resend = new Resend('re_Mvnz2kcJ_6LbmNMnxezBNyHWC6a5VDwHg');
    this.emailContent = new EmailTemplates();
  }

  async sentCrawlInitiatedEmail(email: string) {
    await this.resend.emails.send({
      from: 'opencrawler <no-replay@opencrawler.in>',
      to: [email],
      subject: 'Crawling Initiated',
      html: this.emailContent.crawlingInitiatedEmail(),
    });
  }
  async crawlingCompletedEmail(
    email: string,
    brokenPages: string[] | Set<string>,
    allPages: string[] | Set<string>,
  ) {
    await this.resend.emails.send({
      from: 'opencrawler <no-replay@opencrawler.in>',
      to: [email],
      subject: 'Crawling Initiated',
      html: this.emailContent.crawlingCompletedEmail(allPages, brokenPages),
    });
  }
}
