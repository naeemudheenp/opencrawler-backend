import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { Resend } from 'resend';

@Controller('sent-email')
export class SentEmailController {
  @Get()
  async fetchUrl(@Query('email') email: string, @Res() res: Response) {
    const resend = new Resend('re_Mvnz2kcJ_6LbmNMnxezBNyHWC6a5VDwHg');
    await resend.emails.send({
      from: 'opencrawler <no-replay@opencrawler.in>',
      to: [email],
      subject: 'Website Added to Queue',
      html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          color: #333;
          margin: 0;
          padding: 0;
          line-height: 1.6;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        .email-header {
          text-align: center;
          border-bottom: 1px solid #e5e5e5;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .email-header h1 {
          font-size: 24px;
          color: #2c3e50;
        }
        .email-content {
          font-size: 16px;
          line-height: 1.8;
        }
        .email-footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
          font-size: 14px;
          color: #777;
        }
        .email-footer a {
          color: #3498db;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>Website Added to Queue</h1>
        </div>
        <div class="email-content">
          <p>Dear User,</p>
          <p>
            Thank you for using <strong>Opencrawler</strong>. Your website has been successfully added to our processing queue.
          </p>
          <p>
            We will notify you as soon as the crawling process begins. Please note that depending on the current queue size, this may take some time.
          </p>
          <p>
            If you have any questions or need assistance, feel free to reach out to our support team.
          </p>
        </div>
        <div class="email-footer">
          <p>Best regards,</p>
          <p><strong>Opencrawler Team</strong></p>
          <p>
            <a href="https://opencrawler.in" target="_blank">Visit our website</a> 
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
    });

    return res.status(200).json({});
  }
}
