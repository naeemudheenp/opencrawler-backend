import { Injectable } from '@nestjs/common';
import { InterfaceEmailTemplates } from '../interfaces';

@Injectable()
export class EmailTemplates implements InterfaceEmailTemplates {
  crawlingInitiatedEmail(): string {
    return `
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
          <h1>Crawling Initiated</h1>
        </div>
        <div class="email-content">
          <p>Dear User,</p>
          <p>
            Thank you for choosing <strong>Opencrawler</strong> to analyze your website. We have successfully initiated the crawling process for your website.
          </p>
          <p>
            Please note that this process may take some time, depending on the size and complexity of your site. Once the scan is complete, we will send you a detailed report with the results.
          </p>
          <p>
            If you have any questions in the meantime, feel free to reach out to our support team.
          </p>
        </div>
        <div class="email-footer">
          <p>Best regards,</p>
          <p><strong>Opencrawler Team</strong></p>
          <p>
            <a href="https://opencrawler.in" target="_blank">Visit our website</a> | 
          
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  }
  crawlingCompletedEmail(allPages: string[], brokenUrl: string[]): string {
    const brokenUrlArray = Array.isArray(brokenUrl)
      ? brokenUrl
      : [...brokenUrl];
    const brokenResult = brokenUrlArray.join('<br>');
    const allUrlArray = Array.isArray(allPages) ? allPages : [...allPages];

    return `
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
        .highlight {
          color: #e74c3c;
          font-weight: bold;
        }
        .broken-links {
          background-color: #f2f2f2;
          padding: 10px;
          border: 1px solid #e5e5e5;
          border-radius: 5px;
          font-family: monospace;
          font-size: 14px;
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
          <h1>Opencrawler Report</h1>
        </div>
        <div class="email-content">
          <p>Dear User,</p>
          <p>
            Thank you for choosing <strong>Opencrawler</strong> for your crawling needs. Here is a summary of your request:
          </p>
          <ul>
            <li>Total pages scanned: <span class="highlight">${allUrlArray.length}</span></li>
            <li>Number of broken links found: <span class="highlight">${brokenUrlArray.length}</span></li>
          </ul>
          <p>
            Below is the list of broken links detected during the crawl:
          </p>
          <div class="broken-links">
            ${brokenResult}
          </div>
          <p>
            We hope this report helps you address the issues found. If you have any questions, feel free to contact our support team.
          </p>
        </div>
        <div class="email-footer">
          <p>Best regards,</p>
          <p><strong>Opencrawler Team</strong></p>
          <p>
            <a href="https://opencrawler.in" target="_blank">Visit our website</a> | 
      
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  }
}
